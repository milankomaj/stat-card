import { readFileSync, writeFileSync } from 'fs';
import handlebars from 'handlebars';
import GithubUser from './src/github.js';
import * as svgo from 'svgo';
// import SVGO from 'svgo'; // 🔶
// import nunjucks from 'nunjucks';
//* nunjucks.configure({ autoescape: true });
// import { networkInterfaces } from 'os';
// console.log("✅ networkInterfaces:", networkInterfaces)
// console.log("✅ process.env:", process.env)
// console.log("✅ process.argv:", process.argv)
console.log("✅ process.env.CI:", process.env.CI)
const args = process.argv.slice(2); //🔶  Remove node and script paths
const argSvgo = String(args.includes('-svgo'));
const useSvgo = argSvgo ? argSvgo : ''; //
console.info("✅ useSvgo:", useSvgo)

let username = process.argv[2];
let user = new GithubUser(username);

let templateOverview = readFileSync("templates/overview.svg", 'utf-8');
let templateLanguages = readFileSync("templates/languages.svg", 'utf-8');

user.fetchContent()
    .then(() => {
        let overviewTemplate = handlebars.compile(templateOverview);
        let overviewString = overviewTemplate({ data: user })


        // Optimize overview SVG
        if (useSvgo === 'true') {
            overviewString = SVGO.optimize(overviewString, {
                path: './generated/overview.svg', // For debugging, optional
                multipass: true,
                plugins: [
                    'convertStyleToAttrs',
                    'minifyStyles',
                    'convertColors',
                    'removeUselessStrokeAndFill',
                    'collapseGroups',
                    'reusePaths',
                    'convertTransform',
                    'removeEmptyContainers',
                    'removeDeprecatedAttrs',
                    'convertTransform',
                    'sortAttrs'
                ]
            }).data;
        }
        writeFileSync("./generated/overview.svg", overviewString);

        let languageTemplate = handlebars.compile(templateLanguages);
        let languageString = languageTemplate({ data: user });

        // Modify the language SVG string directly
        languageString = languageString
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&#x3D;/g, "=")
            .replace(/&quot;/g, '"');


        // Optimize languages SVG
        if (useSvgo === 'true') {
            languageString = SVGO.optimize(languageString, {
                path: './generated/languages.svg', // For debugging, optional
                multipass: true,
                plugins: [
                    'minifyStyles',
                    'convertColors',
                    'removeUselessStrokeAndFill',
                    'collapseGroups',
                    'reusePaths',
                    'convertTransform',
                    'removeEmptyContainers',
                    'removeDeprecatedAttrs',
                    'convertTransform',
                    'sortAttrs'
                ]
            }).data;
        }
        writeFileSync('./generated/languages.svg', languageString);
    })
    .catch((error) => {
        console.error("Error fetching content:", error);
    });


/*
    let overviewString = nunjucks.renderString(templateOverview, {
        data: user
    });
*/
