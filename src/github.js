import { Octokit } from "@octokit/rest";
import * as util from "./utils.js";
import { throttling } from "@octokit/plugin-throttling";
import { retry } from "@octokit/plugin-retry";
// import { graphql } from "@octokit/graphql";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import { lang } from './github-lang-colors.js';
console.log("✅ Date:", util.color.randomColorANSI(new Date(Date.now()).toLocaleDateString())) // toLocaleString
const token = process.env.GH_TOKEN //🔶 node and action


const args = process.argv.slice(2); //🔶  Remove node and script paths
const logLevel = args.find(arg => arg === '-info' || arg === '-debug');
const logs = logLevel ? logLevel.substring(1) : 'default'; // Extract 'info' or 'debug'

console.log("✅ logLevel:", util.color.yellow(logs))


const ThrottleOctokit = Octokit.plugin(throttling, retry, paginateGraphQL);
const octokit = new ThrottleOctokit({
  userAgent: 'stat-card',
  auth: token,
  retry: { retries: 10, retryAfter: 10 },
  log: {
    debug: logs === 'debug' ? console.debug : () => { }, // () => { }🔶
    info: logs === 'info' ? console.info : () => { },
    warn: console.warn,
    error: console.error,
  },
  throttle: {
    onSecondaryRateLimit: (retryAfter, options, octokit) => { return true; },
    onRateLimit: (retryAfter, options, octokit, retryCount) => { return true; },
  },
})



class GithubUser {

  constructor(username) {
    this.userName = username;
  }

  async getCommits() {
    let res = await octokit.search.commits({
      q: `author:${this.userName}`
    })
    return res.data.total_count
  }

  async getIssueAndPr(type) {
    let res = await octokit.search.issuesAndPullRequests({
      q: `type:${type} author:${this.userName}`
    })

    return res.data.total_count
  }

  async fetchContent() {
    this.octocat = await octokit.request("GET /octocat");
    console.log(util.color.randomColorANSI(util.arrayBufferToAsciiString(this.octocat.data)));

    this.userContent = await octokit.request("GET /users/{username}", {
      username: this.userName,
    });
    this.repoContent = await octokit.paginate("GET /users/{owner}/repos", {
      owner: this.userName,
      state: 'open',
    });
    this.gistsAll = await octokit.paginate("GET /gists", {});

    if (logs === 'default' && !process.env.CI) { util.startSpinnerAndTimer() } // 🔶

    this.years = await fechYears(this.userName); // 🟠
    const yearsCount = this.years.map((element) => (element)) // 🟠
    this.contributors = await contributors(this.userName); // 🟠
    const reposName = this.repoContent.map((title) => title.name) // fetchAllLanguages,fetchAllcontributors,fetchAllviews
    this.name = this.userContent.data.name;
    this.repo = (this.userContent.data.public_repos);
    this.gists = (this.userContent.data.public_gists);
    const gists_all = this.gistsAll.map((element) => (element))
    this.followers = (this.userContent.data.followers);
    this.created = (this.userContent.data.created_at);
    this.starsCount = 0;
    this.forkCount = 0;
    this.size = 0;
    this.repoContent.forEach(repo => {
      this.starsCount += repo.stargazers_count
      this.forkCount += repo.forks
      this.size += repo.size
    });
    this.commitsCount = await this.getCommits()
    this.issueCount = await this.getIssueAndPr('issue')
    this.prCount = await this.getIssueAndPr('pr')
    this.stars = (this.starsCount);
    this.forks = (this.forkCount);
    this.commits = (this.commitsCount);
    this.issues = (this.issueCount);
    this.pr = (this.prCount);
    this.username = (this.userName);
    this.views = await fetchAllviews(this.userName);
    this.Allcontributors = await fetchAllcontributors(this.userName);
    this.sumA = this.Allcontributors[0]; // added lines
    this.sumD = this.Allcontributors[1]; // deleted lines
    this.contribUcounts = this.Allcontributors[2]; //
    this.sumSum = Number(this.sumA + this.sumD);
    this.progressLangList = await fetchAllLanguages(this.userName);
    this.progress = this.progressLangList[0];
    this.langList = this.progressLangList[1];
    this.graph = (this.sumA >= this.sumD) ? "△" : "▽";
    this.rateLimit = await octokit.request("GET /rate_limit", {}); // 🟡
    this.rates = this.rateLimit.data;
    this.date = new Date(Math.floor(Date.now())).toLocaleString();
    this.langugeDate = "   (" + new Date(this.created).getUTCFullYear() + ")"

    console.info("✅ this.userName:", util.color.blue(this.userName))
    console.info("✅ this.repo:", this.repo)
    console.info("✅ this.gists:", this.gists)
    console.info("✅ gists_all:", (Object.entries(gists_all).length))
    console.info("✅ this.stars:", this.stars)
    console.info("✅ this.size:", util.color.yellow(Number(this.size / 1000).toFixed(2) + " MB "))
    console.info("✅ this.commits:", this.commits)
    console.info("✅ this.views:", this.views)
    console.info("✅ this.prCount:", this.prCount)
    console.info("✅ this.issues:", this.issues)
    console.info("✅ this.forks:", this.forks)
    console.info("✅ this.sumA:", this.sumA)
    console.info("✅ this.sumD:", this.sumD)
    console.info("✅ this.contribUcounts commits :", this.contribUcounts)
    console.info("✅ this.sumSum:", this.sumSum, this.graph)
    console.info("✅ this.contributors :", this.contributors)
    octokit.log.info("✅ this.rates:", this.rates.resources.core)
    octokit.log.info("✅ this.rates.core.reset:", Number(60) - (new Date(Math.floor((Date.now()) - (this.rates.resources.core.reset * 1000))).getUTCMinutes()))

    //* const unix =  Math.floor(this.rates.rate.reset * 1000);
    //* const iso = new Date((unix));
    //* const utc = iso.toUTCString();
    //* const time = iso.toTimeString();
    // console.log("✅ times:",({unix: unix, iso: iso, utc: utc, time: time}))
    // console.log("✅ this.xxx:",this.xxx)
    //* this.repoName = this.repoContent.map((title) => title.name);

    //  🟠🟡🟡 //
    async function fechYears() {
      try {
        const { viewer } = await octokit.graphql({
          query: `
        query {
          viewer {
            contributionsCollection {
              contributionYears
            }
          }
        }`,
        });
        octokit.log.debug("✅ fechYears:", viewer.contributionsCollection.contributionYears)
        const years = viewer.contributionsCollection.contributionYears
        return years;
      } catch (error) {
        console.error(error);
      }
    }



    //  🟠🟡🟡 //
    async function contributors(username) {
      try {
        const contributorsData = await Promise.all(
          yearsCount.map(async (yyy) => {
            const { user } = await octokit.graphql({
              query: `
          query($userName:String!, $from: DateTime!, $to: DateTime!) {
            user(login: $userName) {
              contributionsCollection(from: $from, to: $to) {
                contributionYears
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      contributionCount
                      date
                    }
                  }
                }
              }
            }
          }`,
              userName: username,
              from: `${yyy}-01-01T00:00:00Z`,
              to: `${yyy}-12-31T00:00:00Z`,

            });
            const years = user.contributionsCollection.contributionYears
            const totalContributions = user.contributionsCollection.contributionCalendar.totalContributions
            // octokit.log.debug("✅ totalContributions:", totalContributions)
            return totalContributions;
          })
        )
        const sumContributions = contributorsData.reduce((a, b) => a + b, 0)
        octokit.log.debug("✅ contributorsData:", contributorsData.flatMap(element => element))
        return sumContributions
        // new Date().getFullYear()
        // const years = (user.contributionsCollection.contributionYears)
        // const arr = years.shift()
        // console.log("✅ years.shift():", years)
        // console.log("✅ []con:", user.contributionsCollection.contributionCalendar.totalContributions)
      } catch (error) {
        console.error(error);
      }
    }

    //  🟡🟡🟡 //
    async function fetchAllLanguages(username) {
      try {
        const languageData = await Promise.all(
          reposName.map(async (repo) => {
            const response = await octokit.request('GET /repos/{owner}/{repo}/languages', {
              owner: username,
              repo: repo,
            });
            return response;
          })
        )
        octokit.log.debug("✅ fetchAllLanguages.status:", (languageData.flatMap(element => element.status)));
        const languageCounts = languageData.flatMap(element => element.data).reduce((acc, repoLanguages) => {
          Object.entries(repoLanguages).forEach(([language, bytes]) => {
            acc[language] = (acc[language] || 0) + bytes;
          });
          return acc;
        });
        const totalCode = Object.values(languageCounts).reduce((acc, bytes) => acc + bytes, 0);
        const languageResults = Object.entries(languageCounts).map(([language, bytes]) => ({
          language,
          percentage: ((bytes / totalCode) * 100),
          size: bytes,
          color: lang[language] || util.color.randomColorHEX()
        }));
        octokit.log.debug("✅ json.lang.length:", Object.values(lang).length);
        //------------------------------
        if (logs === 'default' && !process.env.CI) { util.stopSpinnerAndTimer() } // 🔶
        console.table(languageResults);
        let progress = "";
        let langList = "";
        octokit.log.debug("✅ languageResults:", languageResults);
        octokit.log.debug("✅ language:", languageResults.map(result => result.language));
        octokit.log.debug("✅ percentage:", languageResults.map(result => result.percentage.toFixed(3)));
        octokit.log.debug("✅ size:", languageResults.map(result => result.size.toString()));
        const sortedALL = (languageResults).sort((a, b) => b.size - a.size);
        octokit.log.debug("✅ sortedALLanguages-size:", sortedALL);
        octokit.log.debug("✅ sortedLanguages:", languageResults.map(result => result.language).sort());
        octokit.log.debug("✅ sortedPercentage:", languageResults.map(result => result.percentage.toFixed(3)).sort((a, b) => b - a));
        octokit.log.debug("✅ sortedSize:", languageResults.map(result => result.size.toString()).sort((a, b) => b - a));
        const delayBetween = 150;
        octokit.log.debug("✅ randomColorHEX", util.color.blink(util.color.randomColorHEX()));

        for (let i = 0; i < sortedALL.length; i++) {
          const { language, color, percentage, size } = languageResults[i];
          octokit.log.debug("✅ languageResults[i]:", language + " / " + color + " / " + percentage.toFixed(2));
          progress += `<span style="background-color: ${color}; width: ${percentage}%;" class="progress-item"></span>`
          langList +=
            `<li style="animation-delay: ${i * delayBetween}ms;">
           <svg xmlns="http://www.w3.org/2000/svg" class="octicon" style="fill:${color};" viewBox="0 0 16 16" width="16" height="16">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8z"></path>
           </svg>
           <span class="lang">${language}</span>
           <span class="percent">${(percentage).toFixed(2)}%</span>
          </li>\n`;
        }
        // octokit.log.debug("✅ progress:", (progress));
        // octokit.log.debug("✅ langList:", (langList));
        //------------------------------
        return [progress, langList];
      } catch (error) {
        console.error('Error fetching repositories or languages:', error);
        return [];
      }
    }

    //  🟡🟡🟡 //
    async function fetchAllviews(username) {
      try {
        const viewsPromises = reposName.map(repo =>
          octokit.request('GET /repos/{owner}/{repo}/traffic/views', {
            owner: username,
            repo: repo,
            per_page: 100,
          })
        );

        const viewsResults = await Promise.all(viewsPromises);
        octokit.log.debug("✅ fetchAllviews.status:", (viewsResults.flatMap(element => element.status)))
        const views = viewsResults.flatMap(result => result.data);
        const viewsCount = views.map((counts) => counts.count)
        octokit.log.debug("✅ viewsCount:", viewsCount)
        octokit.log.debug("✅ viewsCountSum:", viewsCount.reduce((a, b) => a + b, 0))
        const viewsCountSum = viewsCount.reduce((a, b) => a + b, 0)
        return viewsCountSum;
      } catch (error) {
        console.error(error);
      }
    }

    //  🟡🟡🟡 //
    async function fetchAllcontributors(username) {
      try {
        const contributorsPromises = reposName.map(async (repo) => {
          let retryCount = 0; // Track retry attempts for "202" responses
          let response;

          do {
            response = await octokit.request('GET /repos/{owner}/{repo}/stats/contributors', {
              owner: username,
              repo: repo,
            });

            if (response.status === 202) {
              const retryAfter = parseInt(response.headers["Retry-After"], 10) || 10; // Handle missing or invalid headers
              octokit.log.info(
                `${util.color.blue(response.status)} ` +
                `${util.color.green(repo)} ` +
                `(${util.color.blue("retry")} ${util.color.yellow((retryCount) + 1)}) ` +
                `${util.color.green(retryAfter) + " s"} `
              );
              await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
              retryCount++;
            }
          } while (response.status === 202 && retryCount < 20); // Retry up to 10 times for "202"
          // octokit.log.info("✅ response.headers:", response.headers)
          return response; // Return the final response (200 or failed)
        });

        const contributorsResults = await Promise.all(contributorsPromises);
        octokit.log.debug("✅ fetchAllcontributors.status:", (contributorsResults.flatMap(element => element.status)))
        const contributors = contributorsResults.flatMap(result => result.data);
        octokit.log.debug("✅ contributors hasOwn:login :", Object.entries(contributors).map(([index, total]) => ({
          index,
          total: total.total || "",
          author: Object.values(total.author)[0] || ""
        }))
        )
        const authenticate = (element => element.author ? element.author.login === username : '')
        const contribU = Object.values(contributors).filter(authenticate)
        // octokit.log.debug("✅ contribU counts:", (contribU.flatMap((counts) => counts.total)).reduce((a, b) => a + b, 0))
        const contribUcounts = (contribU.flatMap((counts) => counts.total)).reduce((a, b) => a + b, 0)
        const nA = (contribU.flatMap((counts) => counts.weeks)).map((counts) => counts.a)
        const nD = (contribU.flatMap((counts) => counts.weeks)).map((counts) => counts.d)
        octokit.log.debug("✅ nA.length,nD.length:", nA.length, nD.length)
        octokit.log.debug("✅ lines:", "➕ added:", (nA), "➖ removed:", (nD))
        const sumA = (nA).reduce((a, b) => a + b, 0)
        octokit.log.debug("✅ sumA:", sumA)
        const sumD = (nD).reduce((a, b) => a + b, 0)
        octokit.log.debug("✅ sumD:", sumD)
        return [sumA, sumD, contribUcounts]
      } catch (error) {
        console.error(error)
      }
    }
  }
}
export default GithubUser
