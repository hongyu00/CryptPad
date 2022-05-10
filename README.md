CryptPad is a blockchain application that helps organizations to raise their capital for their projects 
- It allows blockchain based projects to raise capitals and giving access to early-stage sales 
- Offered security to both founders and investors during the fundraising process of the projects
CryptPad acts as a bridge between investors and start-ups organization to get access to the needed funds for the development of the project while early investors can get early access to early-stage deals. 




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
#� �C�r�y�p�t�P�a�d�
�
�
