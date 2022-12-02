const chalk = require('chalk');
const axios = require('axios');
const JsonCycle = require('json-cycle');
const TESTOMAT_URL = process.env.TESTOMATIO_URL || 'https://app.testomat.io';
const { TESTOMATIO_RUNGROUP_TITLE, TESTOMATIO_RUN } = process.env;
const { APP_PREFIX } = require('../constants');
const { isValidUrl } = require('../util');

if (TESTOMATIO_RUN) {
  process.env.runId = TESTOMATIO_RUN;
}

class TestomatioPipe {
  isEnabled = false;

  constructor(params, store = {}) {
    this.apiKey = params.apiKey || process.env.TESTOMATIO;
    if (!this.apiKey) {
      return;
    }
    this.store = store;
    this.title = params.title || process.env.TESTOMATIO_TITLE;
    this.axios = axios.create();
    this.isEnabled = true;
    this.proceed = process.env.TESTOMATIO_PROCEED;
    this.runId = process.env.runId;
    this.createNewTests = !!process.env.TESTOMATIO_CREATE;


    if (!isValidUrl(TESTOMAT_URL.trim())) {
      this.isEnabled = false;
      console.log(
        APP_PREFIX,
        chalk.red(`Error creating report on Testomat.io, report url '${TESTOMAT_URL}' is invalid`),
      );
      return;
    }
  }

  async createRun(runParams) {
    if (!this.isEnabled) return;
    
    runParams.api_key = this.apiKey.trim();
    runParams.group_title = TESTOMATIO_RUNGROUP_TITLE;

    if (this.runId) {
      return this.axios.put(`${TESTOMAT_URL.trim()}/api/reporter/${this.runId}`, runParams)  
    }

    try {
      const resp = await this.axios.post(`${TESTOMAT_URL.trim()}/api/reporter`, runParams, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
      this.runId = resp.data.uid;
      this.runUrl = `${TESTOMAT_URL}/${resp.data.url.split('/').splice(3).join('/')}`;
      this.store.runUrl = this.runUrl;
      this.store.runId = this.runId;      
      console.log(APP_PREFIX, '📊 Report created. Report ID:', this.runId, chalk.gray(`v${this.version}`));
      process.env.runId = this.runId;
    } catch (err) {
      console.log(
        APP_PREFIX,
        'Error creating Testomat.io report, please check if your API key is valid. Skipping report',
      );
    }
  }

  async addTest(data) {
    if (!this.isEnabled) return;
    if (!this.runId) return;
    data.api_key = this.apiKey;
    data.create = this.createNewTests;
    const json = JsonCycle.stringify(data);

    try {
      return await this.axios.post(`${TESTOMAT_URL}/api/reporter/${this.runId}/testrun`, json, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          // Overwrite Axios's automatically set Content-Type
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      if (err.response) {
        if (err.response.status >= 400) {
          const data = err.response.data || { message: '' };
          console.log(
            APP_PREFIX,
            chalk.blue(this.title),
            `Report couldn't be processed: (${err.response.status}) ${data.message}`,
          );
          return;
        }
        console.log(APP_PREFIX, chalk.blue(this.title), `Report couldn't be processed: ${err.response.data.message}`);
      } else {
        console.log(APP_PREFIX, chalk.blue(this.title), "Report couldn't be processed", err);
      }
    }

  }

  async finishRun(params) {
    if (!this.isEnabled) return;
    try {
      if (this.runId && !this.proceed) {
        await this.axios.put(`${TESTOMAT_URL}/api/reporter/${this.runId}`, {
          api_key: this.apiKey,
          status_event: params.statusEvent,
          status: params.status,
        });
        if (this.runUrl) {
          console.log(APP_PREFIX, '📊 Report Saved. Report URL:', chalk.magenta(this.runUrl));
        }
      }
      if (this.runUrl && this.proceed) {
        const notFinishedMessage = chalk.yellow.bold('Run was not finished because of $TESTOMATIO_PROCEED');
        console.log(APP_PREFIX, `📊 ${notFinishedMessage}. Report URL: ${chalk.magenta(this.runUrl)}`);
        console.log(APP_PREFIX, `🛬 Run to finish it: TESTOMATIO_RUN=${this.runId} npx start-test-run --finish`);
      }
    } catch (err) {
      console.log(APP_PREFIX, 'Error updating status, skipping...', err);
    }
  }  
}

module.exports = TestomatioPipe;