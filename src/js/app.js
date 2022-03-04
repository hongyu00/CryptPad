App = {
  web3Provider: null,
  contracts: {},
  adminAccount: "0x9E417B38dB374B22221715EB9A092FB0Cb70EE13".toLowerCase(),
  
  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
    
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });;
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {

      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('CryptPad.json', function(data) {
      var CryptPadArtifact = data;
      App.contracts.Launchpad = TruffleContract(CryptPadArtifact);

      App.contracts.Launchpad.setProvider(App.web3Provider);

      if(web3.eth.accounts[0] != App.adminAccount){
        jQuery('#user_profile').css('display','block');
        jQuery('#admin_add_project').css('display','none');
      }
      else{
        jQuery('#user_profile').css('display','none');
        jQuery('#admin_add_project').css('display','block');
      }

      var path = window.location.pathname.replace('/', '');

      switch(path) {
        case "":
        case "index.html": return App.showAllProjects();
        case "productDetail.html":
          //Refer to https://fellowtuts.com/jquery/get-query-string-values-url-parameters-javascript/
          var urlParams = new URLSearchParams(window.location.search);
          var id = urlParams.get('id');

          return App.showProjectDetail(id);
          case "investmentUser.html": return App.showAllTransactions();
      }
    });
    return App.bindEvents();
  },
  
  bindEvents: function() {
    $(document).on('click', '#btn-addproj', App.addNewProject);
    $(document).on('click', '.btn-MoreInfo', App.redirectToDetail);
    $(document).on('click', '#btn-investproj', App.investProject);
    $(document).on('click', '#btn-conclude', App.concludeTransaction);
    $(document).on('click', '#btn-toInvestPage', function(){
      var address = $('#address').val();
      App.showProjectDetails(address);
    });

    window.ethereum.on('accountsChanged', function (accounts) {
      if(accounts[0] != App.adminAccount){
        jQuery('#user_profile').css('display','block');
        jQuery('#admin_add_project').css('display','none');
      }
      else{
        jQuery('#user_profile').css('display','none');
        jQuery('#admin_add_project').css('display','block');
      }
    })
  },

  showAllProjects: function() {
    var launchpadInstance;

    App.contracts.Launchpad.deployed().then(function(instance) {
      launchpadInstance = instance;

      return launchpadInstance.getProjectLength();
    }).then(function(result) {
      var arrayLength = result.c[0];
      var projectsRow = $('#projectsRow');
      var projectsTemplate = $('#projectsTemplate');

      // show sample data
      $.getJSON('../projects.json', function(data) {

        for (i = 0; i < data.length; i ++) {
          projectsTemplate.find('.btn-MoreInfo').attr('data-id', -1 + data[i].projectId);
          projectsTemplate.find('.project-name').text(data[i].projectName);

          var projectStatus  = data[i].hasSettledPayment;
          var projectSuccess = data[i].projectSuccess;
          var stringStatus   = "";

          if (projectStatus == "true" && projectSuccess == "false") stringStatus = "Failed";
          else if (projectStatus == "true" && projectSuccess == "true") stringStatus = "Success";
          else stringStatus = "New";

          projectsTemplate.find('.project-status').text(stringStatus);
          projectsTemplate.find('.project-token-name').text("Token Name: " + data[i].tokenName);
          projectsTemplate.find('.project-apy').text("Interest Rate: " + data[i].interestRate / 100 + "%");

          var target  = data[i].fundraiseGoal / (10**18);
          var current = data[i].totalRaised / (10**18);

          var percentage = (current / target * 100).toFixed(2);

          projectsTemplate.find('.w3-container').text(percentage + "%");
          projectsTemplate.find('.w3-red').css('width', Math.round(percentage) + "%");
          projectsTemplate.find('.project-total-raised').text(current + "/" + target);

          projectsTemplate.find('.all').attr("class", "col-lg-4 col-md-4 all");
          projectsTemplate.find('.all').addClass(stringStatus.toLowerCase());

          projectsRow.append(projectsTemplate.html());
        }
      });

      // for actual data from back-end
      for (var i = 0; i < arrayLength; i++) {
        launchpadInstance.getProjectByIndex(i).then(function(data) {

          projectsTemplate.find('.btn-MoreInfo').attr('data-id', data[0] - 1);
          projectsTemplate.find('.project-name').text(data[1]);

          var projectStatus  = data[3];
          var projectSuccess = data[4];
          var stringStatus   = "";

          if (projectStatus == true && projectSuccess == false) stringStatus = "Failed";
          else if (projectStatus == true && projectSuccess == true) stringStatus = "Success";
          else stringStatus = "New";

          projectsTemplate.find('.project-status').text(stringStatus);
          projectsTemplate.find('.project-token-name').text("Token Name: " + data[5]);
          projectsTemplate.find('.project-apy').text("Interest Rate: " + data[7] / 100 + "%");

          var target  = data[9].c[0];
          var current = data[10].c[0];

          // var target  = data[9].c[0] / 10000;
          // var current = data[10].c[0] / 10000;
          var percentage = (current / target * 100).toFixed(2);

          projectsTemplate.find('.w3-container').text(percentage + "%");
          projectsTemplate.find('.w3-red').css('width', Math.round(percentage) + "%");
          projectsTemplate.find('.project-total-raised').text(current + "/" + target);

          projectsTemplate.find('.all').attr("class", "col-lg-4 col-md-4 all");
          projectsTemplate.find('.all').addClass(stringStatus.toLowerCase());

          projectsRow.append(projectsTemplate.html());

        });
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  redirectToDetail: function(event) {
    event.preventDefault();
    var id = parseInt($(event.target).data('id'));

    window.location.href = "productDetail.html?id=" + id;
  },

  showProjectDetail: function(index) {
    var launchpadInstance;

    // sample data
    if (index < 0) {
      $.getJSON('../projects.json', function(data) {

        var currentData;

        if (index == -10) currentData = data[0];
        else currentData = data[1];

        $('#projName').text(currentData.projectName);
        $('#projDesc').text(currentData.projectDescription);
        $('#tokenName').text(currentData.tokenName);
        $('#tokenValue').text(currentData.tokenValue / (10**18));
        $('#apy').text(currentData.interestRate / 100);
        $('#farmPeriod').text(currentData.projectDuration);

        var target  = currentData.fundraiseGoal / (10**18);
        var current = currentData.totalRaised / (10**18);
        var percentage = (current / target * 100).toFixed(2);

        $('#goal').text(target);
        $('#sold').text(current);
        $('#projProgressView').css('width', Math.round(percentage) + "%");
        $('#projProgress').text(percentage + "%");
        $('#projAddr').text(currentData.projectAddress);

        $('#btn-investproj').hide();
        $('#btn-conclude').hide();
        $('.inactive').hide();
      });
    }
    else {
      App.contracts.Launchpad.deployed().then(function(instance) {
        launchpadInstance = instance;
      
        return launchpadInstance.getProjectByIndex(index);
      }).then(function(data) {
            $('#projName').text(data[1]);
            $('#projDesc').text(data[2]);
            $('#tokenName').text(data[5]);
            $('#tokenValue').text(data[6].c[0] / 10000);
            // $('#tokenValue').text(data[6].c[0]);
            $('#apy').text(data[7] / 100);
            $('#farmPeriod').text(data[8]);

            // var target  = data[9].c[0] / 10000;
            // var current = data[10].c[0] / 10000;
            var target  = data[9].c[0];
            var current = data[10].c[0];
            var percentage = (current / target * 100).toFixed(2);

            $('#goal').text(target);
            $('#sold').text(current);
            $('#projProgressView').css('width', Math.round(percentage) + "%");
            $('#projProgress').text(percentage + "%");
            $('#projAddr').text(data[11]);

            var projectStatus  = data[3];
            var projectSuccess = data[4];

            if (projectStatus == true && projectSuccess == false) $('#btn-investproj').hide();
            else if (projectStatus == true && projectSuccess == true) $('#btn-investproj').hide();

            if (web3.eth.accounts[0] != App.adminAccount) $('#btn-conclude').hide();
            else {
              $('#btn-investproj').hide();
              
            }
      }).catch(function(err) {
        console.log(err.message);
      });
    }
  },

  addNewProject: function() {
    var actionAccount = web3.eth.accounts[0];
    web3.eth.defaultAccount = App.adminAccount;

    if(actionAccount != App.adminAccount){
      alert("Please log into an admin account to add a new project!");
      return;
    }
    
    var projName = document.getElementById("project_name").value;
    var projDesc = document.getElementById("project_desc").value;
    var token_name = document.getElementById("token_name").value;
    var token_value = document.getElementById("token_value").value;
    var annual_percentage_yield = document.getElementById("annual_percentage_yield").value;
    var farming_period = document.getElementById("farming_period").value;
    var fundraised_goal = document.getElementById("fundraised_goal").value;
    var project_address = document.getElementById("project_address").value;
    var errorMsg = "";

    if(projName.length == 0){
      errorMsg += "Project name can't be empty!";
      errorMsg += "\n";
    }

    if(projDesc.length == 0){
      errorMsg += "Project description can't be empty!";
      errorMsg += "\n";
    }

    if(token_name.length != 3) {
      errorMsg += "Token name must have three alphabet!";
      errorMsg += "\n";
    }

    if(token_value == 0){
      errorMsg += "Token value can't be empty!";
      errorMsg += "\n";
    }

    if(token_value < 0) {
      errorMsg += "Please enter a valid token value!";
      errorMsg += "\n";
    }

    if(annual_percentage_yield == 0) {
      errorMsg += "Interest Rate can't be empty!";
      errorMsg += "\n";
    }

    if(annual_percentage_yield < 0) {
      errorMsg += "Please enter a valid interest rate!";
      errorMsg += "\n";
    }

    if(farming_period == 0){
      errorMsg += "Project period can't be empty!";
      errorMsg += "\n";
    }

    if(farming_period < 0){
      errorMsg += "Please enter a valid Project period!";
      errorMsg += "\n";
    }

    if(farming_period % 1 != 0){
      errorMsg += "Please enter a valid Project period!";
      errorMsg += "\n";
    }

    if(fundraised_goal == 0) {
      errorMsg += "Fundraise goal can't be empty!";
      errorMsg += "\n";
    }

    if(fundraised_goal < 0) {
      errorMsg += "Please enter a valid fundraise goal!";
      errorMsg += "\n";
    }

    var isAddress = false;
      if (!/^(0x)?[0-9a-f]{40}$/i.test(project_address)) {
          // check if it has the basic requirements of an address
          isAddress = false;
      } else {
          isAddress = true;
      }
  
    if(!isAddress){
      errorMsg += "Please enter a valid receiver account's address!";
      errorMsg += "\n";
    }

    if(project_address == 0) {
      errorMsg += "Receiver account's address can't be empty!";
      errorMsg += "\n";
    }

    if(errorMsg != ""){
      alert(errorMsg);
      return;
    }

    var convertedTokenValue = web3.toWei(token_value, 'ether');
    var convertedAnnualPercentageYield = annual_percentage_yield * 100;
    var convertedFundraiseGoal = fundraised_goal;

    var messages = "Project Name: " + projName + "\n" + "Project Description: " + projDesc + "\n" + "Token Name: " + token_name + "\n" + "Token Value: " + token_value + " ETH\n" + "Interest Rate: " + annual_percentage_yield + "%\n" + "Project Duration: " + farming_period + " days\n" + "Fundraised Goal: " + convertedFundraiseGoal + " token\n" + "Project Address: " + project_address;
    alert(messages);
    var launchpadInstance;
    App.contracts.Launchpad.deployed().then(function(instance) {
      launchpadInstance = instance;
    
      return launchpadInstance.addProject(projName, projDesc, token_name, convertedTokenValue, convertedAnnualPercentageYield, farming_period, convertedFundraiseGoal, project_address).call; //  call func in smart contract
    })

  },
  
  showAllTransactions: function() {
    var launchpadInstance;

    App.contracts.Launchpad.deployed().then(function(instance) {
      launchpadInstance = instance;

      return launchpadInstance.getTransactionLength();
    }).then(function(result) {
      var arrayLength = result.c[0];
      var row = $('#transRow');
      var template = $('#transTemplate');

      // show sample data
      $.getJSON('../userinvest.json', function(data) {
        for (i = 0; i < data.length; i++) {
          template.find('.projName').text(data[i].projName);
          template.find('.projAddress').text(data[i].projAddress);
          template.find('.tokenValue').text(data[i].tokenValue);
          template.find('.purchaseAmount').text(data[i].purchaseAmount + " " + data[i].tokenName);
          template.find('.interestEarned').text(data[i].interestEarned);
          template.find('.totalToken').text(data[i].totalToken);
          row.append("<tr>" + template.html() + "</tr>");
        }
      });

      for (var i = 0; i < arrayLength; i++) {
        launchpadInstance.getTransactionByIndex(i).then(function(data) {

          template.find('.projName').text(data[0]);
          template.find('.projAddress').text(data[1]);
          template.find('.tokenValue').text(data[2] / (10**18));

          var amount   = data[4].c[0];
          var interest = data[5].c[0] / 1000;
          var interestEarn = amount * interest / 100;
          var total = amount + (amount * interest / 100);

          template.find('.purchaseAmount').text(amount + data[3]);
          template.find('.interestEarned').text(interestEarn);
          template.find('.totalToken').text(total);
          row.append("<tr>" + template.html() + "</tr>");
        });
      }


    }).catch(function(err) {
      console.log(err.message);
    });
  },

  investProject: function(){
    var actionAccount = web3.eth.accounts[0];
    
    if(actionAccount == App.adminAccount){
      alert("Admin is not allowed to invest into any of the project!");
      return;
    }

    var projAddr = document.getElementById("projAddr").innerText;
    var buyAmount = document.getElementById("buyAmount").value;
    var goal = document.getElementById("goal").innerText;
    var sold = document.getElementById("sold").innerText;
    var tokenValue = document.getElementById("tokenValue").innerText;

    var paidEth = (tokenValue*buyAmount);
    if(buyAmount <= 0){
      alert("Buy amount needs to be more than 0!");
      return;
    }
    if( buyAmount > (goal-sold)){
      alert("You have exceed the current available token!\nYou can only purchase a maximum of " + (goal-sold) + " token!");
      return;
    }
    alert("Project Address: " + projAddr + "\nBuy Amount: " + buyAmount + "\n\nPaid in Ether: " + paidEth + " Eth");

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
  
    var account = accounts[0];
  
     App.contracts.Launchpad.deployed().then(function(instance) {
      launchpadInstance = instance;
        
        return launchpadInstance.invest(projAddr, buyAmount, {from: account, value:(web3.toWei(paidEth, 'ether'))}).call; //  call func in smart contract
      });
    })

  },

  concludeTransaction: function(){
    var actionAccount = web3.eth.accounts[0];
    web3.eth.defaultAccount = App.adminAccount;

    if(actionAccount != App.adminAccount){
      alert("Only admin can use this function");
      return;
    }
    var projAddr = document.getElementById("projAddr").innerText;
    var tokenValue = document.getElementById("tokenValue").innerText;
    var goal = document.getElementById("goal").innerText;
    var sold = document.getElementById("sold").innerText;
    var refundAmount = sold*tokenValue;
    
    var transferAmount = goal*tokenValue;
    //means project failed
    if(goal != sold){
      transferAmount = refundAmount;
    }

    //alert("Project Address: " + projAddr + "\nEther to be transferred: " + transferAmount + " Eth");
    App.contracts.Launchpad.deployed().then(function(instance) {
      launchpadInstance = instance;      
      //change function
      return launchpadInstance.concludeTransaction(projAddr, {from: web3.eth.defaultAccount, value:web3.toWei(transferAmount, 'ether')}).call; //  call func in smart contract
    })
  },
};

$(function() {
  $(window).on("load", function (e) {
    App.init();
  });
});
