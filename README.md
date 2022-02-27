# Alterflo Web App (React)
	1. Make sure pre-intsall globally apps NODE and YARN
	2. Open cmd/terminal and run this `git clone <Clone Link>`
	3. Go to project path run these commands:
    	1. `yarn install`
	4. run `yarn start` to run app on browser (Development API - http://localhost:3000)
	5. run `yarn start:qa` to run app on browser (QA API - http://localhost:3000)
	6. run `yarn start:prod` to run app on browser (Production API - http://localhost:3000)
	7. run `yarn build:dev` to make DEV build
	7. run `yarn build:qa` to make QA build
	8. run `yarn build:prod` to make Production build


# Commit Standards
	1. Run `yarn run commit` to do commit
 	2. Select commit type as per changes: `feat, fix...`
	3. Add message (You can skip the optional inputs)

# Amplitude Analytics
[Amplitude](https://amplitude.com/) is used to track user analytics. To enable Amplitude tracing, define the env var 
`REACT_APP_AMPLITUDE_API_KEY` in the .env file. Contact the administrator regarding project API keys.