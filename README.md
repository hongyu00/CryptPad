Step to install: 

1) In Ganache 
- click open new workspace 
- click add project and select truffle-config.js
- create new workspace

Note:
- must done step 1 first only can use "truffle migrate" in further step

2) Import account into Metamask
- copy the private key in ganache

3) Enter PowerShell Command
cd C:\Users\CZY\Desktop\Dapp\CryptPad    
truffle compile
truffle migrate
npm run dev

4) Connect imported account to the site

Note: 
- first command is the path to your folder
- Use this command if it mention lite-server not installed "npm install lite-server@2.3 --save-dev"

5) Change the adminAccount in app.js & platform address in CryptPad.sol to your first address
6) When add new project, the project address need to be a real address
#   C r y p t P a d  
 