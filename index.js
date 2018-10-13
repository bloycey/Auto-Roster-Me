const fs = require('fs');
const tabula = require('tabula-js');
const readline = require('readline');
const {google} = require('googleapis');

const source1 = tabula("./pdf/1.pdf", {pages: "1-2"})
const source2 = tabula("./pdf/2.pdf", {pages: "1-2"})

const sources = [source1, source2]; 

for (let i = 0; i < sources.length; i++) {
    sources[i].extractCsv((err, data) => {

        const roster = data;
        const dates = roster[0].split(',');

        function findName(input) {
            return input.includes("Bloyce");
        }

        const nameIndex = roster.findIndex(findName);
        
        const currentWeek = roster[nameIndex].split(',');

        function shiftStart(raw) {
            let start = raw.replace('"', '').substring(0,5);
            return start;
        }

        function shiftEnd(raw) {
            let end = raw.replace('"', '').substring(6,11);
            return end;
        }

        function getLocation(raw) {
            let location = raw.replace('"', '').slice(14);
            return location
        }

        function pad(num) {
            return (num < 10) ? '0' + num.toString() : num.toString();
        }

        function formatDate(rawDate) {
                return "2018-" + pad(rawDate[1]) + "-" + pad(rawDate[0]);
        }

        const mondayDateRaw = dates[1].replace("Mon ", '').split("/");
        const tuesdayDateRaw = dates[2].replace("Tue ", '').split("/");
        const wednesdayDateRaw = dates[3].replace("Wed ", '').split("/");
        const thursdayDateRaw = dates[4].replace("Thu ", '').split("/");
        const fridayDateRaw = dates[5].replace("Fri ", '').split("/");
        const saturdayDateRaw = dates[6].replace("Sat ", '').split("/");
        const sundayDateRaw = dates[7].replace("Sun ", '').split("/");

        const shifts = {
            monday: {
                title: "QPAC " + getLocation(currentWeek[2]),
                date: formatDate(mondayDateRaw),
                shiftStart: shiftStart(currentWeek[2]),
                shiftEnd: shiftEnd(currentWeek[2]),
                location: getLocation(currentWeek[2])
            },
            tuesday: {
                title: "QPAC " + getLocation(currentWeek[3]),
                date: formatDate(tuesdayDateRaw),
                shiftStart: shiftStart(currentWeek[3]),
                shiftEnd: shiftEnd(currentWeek[3]),
                location: getLocation(currentWeek[3])
            },
            wednesday: {
                title: "QPAC " + getLocation(currentWeek[4]),
                date: formatDate(wednesdayDateRaw),
                shiftStart: shiftStart(currentWeek[4]),
                shiftEnd: shiftEnd(currentWeek[4]),
                location: getLocation(currentWeek[4])
            },
            thursday: {
                title: "QPAC " + getLocation(currentWeek[5]),
                date: formatDate(thursdayDateRaw),
                shiftStart: shiftStart(currentWeek[5]),
                shiftEnd: shiftEnd(currentWeek[5]),
                location: getLocation(currentWeek[5])
            },
            friday: {
                title: "QPAC " + getLocation(currentWeek[6]),
                date: formatDate(fridayDateRaw),
                shiftStart: shiftStart(currentWeek[6]),
                shiftEnd: shiftEnd(currentWeek[6]),
                location: getLocation(currentWeek[6])
            },
            saturday: {
                title: "QPAC " + getLocation(currentWeek[7]),
                date: formatDate(saturdayDateRaw),
                shiftStart: shiftStart(currentWeek[7]),
                shiftEnd: shiftEnd(currentWeek[7]),
                location: getLocation(currentWeek[7])
            },
            sunday: {
                title: "QPAC " + getLocation(currentWeek[8]),
                date: formatDate(sundayDateRaw),
                shiftStart: shiftStart(currentWeek[8]),
                shiftEnd: shiftEnd(currentWeek[8]),
                location: getLocation(currentWeek[8])
            }
        }

        // console.log(shifts);


        /******CREATE GOOGLE CALENDAR EVENTS ****/


        // If modifying these scopes, delete token.json.
        const SCOPES = ['https://www.googleapis.com/auth/calendar'];
        const TOKEN_PATH = 'token.json';

        // Load client secrets from a local file.
        fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Calendar API.
        authorize(JSON.parse(content), listEvents);
        });

        /**
         * Create an OAuth2 client with the given credentials, and then execute the
         * given callback function.
         * @param {Object} credentials The authorization client credentials.
         * @param {function} callback The callback to call with the authorized client.
         */
        function authorize(credentials, callback) {
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getAccessToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);
        });
        }

        /**
         * Get and store new token after prompting for user authorization, and then
         * execute the given callback with the authorized OAuth2 client.
         * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
         * @param {getEventsCallback} callback The callback for the authorized client.
         */
        function getAccessToken(oAuth2Client, callback) {
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
            });
            console.log('Authorize this app by visiting this url:', authUrl);
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question('Enter the code from that page here: ', (code) => {
                rl.close();
                oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) console.error(err);
                    console.log('Token stored to', TOKEN_PATH);
                });
                callback(oAuth2Client);
                });
            });
        }

        /**
         * Lists the next 10 events on the user's primary calendar.
         * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
         */
        function listEvents(auth) {
            const calendar = google.calendar({version: 'v3', auth});

            for (let property in shifts) {
                if (shifts[property].shiftStart !== '') {
                    let event = {
                        'summary': shifts[property].title,
                        'location': 'Queensland Performing Arts Centre',
                        'description': 'QPAC Shift created with Node',
                        'colorId': '5',
                        'start': {
                        'dateTime': shifts[property].date + "T" + shifts[property].shiftStart + ":00",
                        'timeZone': 'Australia/Brisbane',
                        },
                        'end': {
                        'dateTime': shifts[property].date + "T" + shifts[property].shiftEnd + ":00",
                        'timeZone': 'Australia/Brisbane',
                        },
                        'reminders': {
                        'useDefault': true,
                        },
                    };

                    console.log(event.summary);

                    calendar.events.insert({
                        auth: auth,
                        calendarId: 'primary',
                        resource: event,
                    }, function(err, event) {
                        if (err) {
                        console.log('There was an error contacting the Calendar service: ' + err);
                        return;
                        }
                        console.log('Event created: %s', event.data.htmlLink);
                    });
                }
            }
        }
    });
}