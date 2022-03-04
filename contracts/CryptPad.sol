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
    address payable platformAddress = 0x9E417B38dB374B22221715EB9A092FB0Cb70EE13;

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

     modifier chkValidity(address projAddr, uint buyAmount){
        //require(projects[projAddr].projectStatus == ProjectStatus.Launch, "Project has yet to start or has ended");
        uint duration = projects[projAddr].projectDuration * 1 minutes;
        require(block.timestamp < (projects[projAddr].dateCreated + duration), "Project has ended!!!");
        require(msg.value == (buyAmount * projects[projAddr].tokenValue), "Insufficient fund to purchase");
        _;
    }

    //for Invest in new project/ multiple projects + Add investment
    function invest( address projAddr, uint buyAmount) public payable chkValidity(projAddr, buyAmount){
        
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

    modifier chkStatus(address projAddr){
        require(projects[projAddr].hasSettledPayment == false, "Payment has been settled!");
        uint duration = projects[projAddr].projectDuration * 1 minutes;
        require(block.timestamp >= (projects[projAddr].dateCreated + duration), "Project has not ended yet!!!");
        _;
    }

    function concludeTransaction(address payable projAddr) public payable chkStatus(projAddr){
        //require(projects[projAddr].projectStatus == ProjectStatus.End, "Project has not ended yet");
        if(projects[projAddr].fundraiseGoal == projects[projAddr].totalRaised){
            //give to project address
            //bool sent = projAddr.send((projects[projAddr].fundraiseGoal*(projects[projAddr].tokenValue)));
            address(projAddr).transfer(msg.value);
            //bool sent = projAddr.send(msg.value);
            
            //require(sent, "Failed to send Ether1");
            //distribute token along with annualPercentageYield
            // for(uint i=0; i < transaction.length; i++){
            //     if(transaction[i].projectAddress == projAddr){
            //         uint apy = (((1 + ((projects[projAddr].annualPercentageYield/10000)/projects[projAddr].farmingPeriod))**(projects[projAddr].farmingPeriod))-1)*four_decimals_value;
            //         transaction[i].amount = (transaction[i].amount + ((transaction[i].amount * apy)));
            //      }
            // }
            projects[projAddr].hasSettledPayment = true;
            projects[projAddr].projectSuccess = true;
        }
        else{
           //refund
            for(uint i=0; i < transaction.length; i++){
            //address payable investorAddr = transaction[i].investorAddress;
                if(transaction[i].projectAddress == projAddr){
                    uint refundAmount = projects[projAddr].tokenValue * transaction[i].amount;
                    bool sent = transaction[i].investorAddress.send(refundAmount*eighteen_decimals_value);
                     //(bool sent,) = transaction[i].investorAddress.call(abi.encode(refundAmount));
                     require(sent, "Failed to send Ether2");
                    //payable(investorAddr).transfer(transaction[i].amount);
                    //update token value
                    transaction[i].amount = 0;
                    transction[i].interest = 0;
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