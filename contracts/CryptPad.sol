//SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract CryptPad {
    enum TransactionStatus {Pending, Completed, Refunded}
    uint private constant eighteen_decimals_value = 1000000000000000000;
    uint private constant four_decimals_value = 10000;

    struct Project{
            uint projectId;
            string projectName;
            string projectDescription;
            bool hasSettledPayment;
            bool projectSuccess;
            string tokenName;
            uint tokenValue;
            uint interestRate;
            uint projectDuration;
            uint fundraiseGoal;
            uint totalRaised;
            address payable projectAddress;
            uint dateCreated;
        }

    struct Transaction {
        uint amount;
        address projectAddress;
        address payable investorAddress;
        uint interest;
    }

    uint projectId = 1;
    uint public projCount = 0;
    uint totalRaised = 0;
    uint public transactionCount = 0;
    address payable platformAddress = 0xDa3C008eFC2E8416C471ae459039Ec52C809fB9a;

    address admin;
    Project[] project;
    Transaction[] transaction;
    
    mapping(address => Project) projects;

    constructor() public{
        admin = msg.sender;
    }

    modifier onlyAdmin(){
        require (admin == msg.sender, "Only admin can use this function");
        _;
    }

    
    function invest( address projAddr, uint buyAmount) public payable{
        
        //(bool sent, ) = platformAddress.call {value:msg.value} ("");
        //require(sent, "Failed to send Ether");
        address(platformAddress).transfer(msg.value);
       //when display at ui, need divide 10000
        transaction.push(Transaction(buyAmount, projAddr, msg.sender, (projects[projAddr].interestRate*buyAmount)));
        
        projects[projAddr].totalRaised += buyAmount;

        for (uint i = 0; i < project.length; i++) {
            if (project[i].projectAddress == projAddr) {
                project[i].totalRaised += buyAmount;
                break;
            }
        }

        transactionCount++;
    }

    function projectInvestmentPercentage(address projAddr) public view returns (uint) {
            uint a = projects[projAddr].totalRaised;
            uint b = projects[projAddr].fundraiseGoal;

            return (a / b * 100);
    }

   
    function concludeTransaction(address payable projAddr) public payable{
        if(projects[projAddr].fundraiseGoal == projects[projAddr].totalRaised){
            address(projAddr).transfer(msg.value);
            projects[projAddr].hasSettledPayment = true;
            projects[projAddr].projectSuccess = true;
        }
        else{
           //refund
            for(uint i=0; i < transaction.length; i++){
                if(transaction[i].projectAddress == projAddr){
                    uint refundAmount = projects[projAddr].tokenValue * transaction[i].amount;
                    bool sent = transaction[i].investorAddress.send(refundAmount*eighteen_decimals_value);
                     require(sent, "Failed to send Ether2");
                    //update token value
                    transaction[i].amount = 0;
                    transaction[i].interest = 0;
                 }
             }
            projects[projAddr].projectSuccess = false;
            projects[projAddr].hasSettledPayment = true;
        }

        for (uint i = 0; i < project.length; i++) {
            if (project[i].projectAddress == projAddr) {
                project[i].projectSuccess =  projects[projAddr].projectSuccess;
                project[i].hasSettledPayment =  projects[projAddr].hasSettledPayment;
                break;
            }
        }
    }

    // Add Project
    function addProject(string memory _projName, string memory _projDesc, string memory _tokenName, uint _tokenValue, uint _interestRate, uint _projectDuration, uint _fundraiseGoal, address payable _addr) public{
        Project memory proj = Project(projectId, _projName, _projDesc, false, false,_tokenName,_tokenValue, _interestRate, _projectDuration, _fundraiseGoal, totalRaised, _addr, block.timestamp);

        project.push(proj);
        projects[_addr] = proj;
        projCount ++;
        projectId ++;
    }

    function getProjectByIndex(uint index) public view returns (uint, string memory, string memory, bool, bool, string memory, uint, uint, uint, uint, uint, address payable) {
        Project memory proj = project[index];

        return (proj.projectId, proj.projectName, proj.projectDescription, proj.hasSettledPayment, proj.projectSuccess, proj.tokenName, proj.tokenValue, proj.interestRate, proj.projectDuration, proj.fundraiseGoal, proj.totalRaised, proj.projectAddress);
    }

    function getProjectLength() public view returns (uint) {
        return project.length;
    }

    function getTransactionByIndex(uint index) public view returns (string memory, address payable, uint, string memory, uint, uint) {
        Transaction memory trans = transaction[index];
        Project memory proj = projects[trans.projectAddress];

        return (proj.projectName, proj.projectAddress, proj.tokenValue, proj.tokenName, trans.amount, trans.interest);
    }

    function getTransactionLength() public view returns (uint) {
        return transaction.length;
    }
}