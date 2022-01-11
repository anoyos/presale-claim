var currentAddr;
var networkID = 0;

var web3 = null;
var tempWeb3 = null;

var token = null;
var presaleContract = null;

window.addEventListener('load', () => {
    //Reset
    token = null;
    currentAddr = null;
    presaleContract = null;
    web3 = null;
    tempWeb3 = null;

    mainContractInfo();
    Connect();
})



async function mainContractInfo() {
    if (NETID == 56) {
        web3 = new Web3('https://bsc-dataseed1.binance.org:443');
    } else {
        web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');
    }
    token = await new web3.eth.Contract(ABI_TOKEN, ADDRESS_TOKEN);
    presaleContract = await new web3.eth.Contract(ABI_PRESALE, ADDRESS_PRESALE);
    update();
}

async function getCurrentWallet() {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
            currentAddr = accounts[0]
            var connectedAddr = currentAddr[0] + currentAddr[1] + currentAddr[2] + currentAddr[3] + currentAddr[4] + currentAddr[5] + '...' + currentAddr[currentAddr.length - 6] + currentAddr[currentAddr.length - 5] + currentAddr[currentAddr.length - 4] + currentAddr[currentAddr.length - 3] + currentAddr[currentAddr.length - 2] + currentAddr[currentAddr.length - 1]
            $("#btn-connect").text(connectedAddr);
            $("#btn-connect").prop("disabled", true);
        }
    }
}

async function Connect() {
    if (window.ethereum) {
        tempWeb3 = new Web3(window.ethereum)
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" })
            let accounts = await window.ethereum.request({ method: 'eth_accounts' })
            currentAddr = accounts[0]
            window.ethereum.on('chainChanged', (chainId) => {
                window.location.reload();
            });
            runAPP()
            return
        } catch (error) {
            console.error(error)
        }
    }
}


async function runAPP() {
    networkID = await tempWeb3.eth.net.getId()
    if (networkID == NETID) {
        web3 = tempWeb3;
        token = await new web3.eth.Contract(ABI_TOKEN, ADDRESS_TOKEN);
        presaleContract = await new web3.eth.Contract(ABI_PRESALE, ADDRESS_PRESALE);

        getCurrentWallet();
        update();
        setInterval(update, 5000);
    } else {

        alert("Wrong network, please change to Binance Smart Chain network");

        if (window.ethereum) {
            const data = [{
                    chainId: '0x38',
                    //chainId: '0x61', //Testnet
                    chainName: 'Binance Smart Chain',
                    nativeCurrency: {
                        name: 'BNB',
                        symbol: 'BNB',
                        decimals: 18
                    },
                    rpcUrls: ['https://bsc-dataseed.binance.org/'],
                    blockExplorerUrls: ['https://bscscan.com/'],
                }]
                /* eslint-disable */
            const tx = await window.ethereum.request({ method: 'wallet_addEthereumChain', params: data }).catch()
            if (tx) {
                console.log(tx)
            }
        }
    }
}


$("#btn-connect").click(() => {
    console.log('---------', window.ethereum)
    if (window.ethereum) {
        Connect();
    } else {
        alert("Please install Metamask or Trust first");
    }
})

function update() {
    console.log("Update");
    updateParameters();
}

async function updateParameters() {

    if (currentAddr != null && currentAddr != undefined && currentAddr != "") {
        var yourBNB = await web3.eth.getBalance(currentAddr);
        $("#your-bnb").text((yourBNB / 1e18).toFixed(2) + " BNB");
    }

    if (token) {
        if (currentAddr != null && currentAddr != undefined && currentAddr != "") {

            token.methods.balanceOf(currentAddr).call().then(res => {
                your_balance = (res / 1e9).toFixed(0);
                $("#your-jus").text(your_balance);
            })
        }
    }

    if (presaleContract) {
        presaleContract.methods.currentRound().call().then(currentRound => {
            console.log("currentRound: " + currentRound)
            presaleContract.methods.rounds(currentRound).call().then(res => {
                var hardCap = res.hardcap / 1e9;
                var sold = res.sold / 1e9
                var percent = (100 * (sold + ADDED_MORE) / hardCap).toFixed(0)
                console.log(hardCap + " - " + sold + " - " + percent);
                $("#progress-txt").text(percent + " %")
                $("#progress-bar").css("width", percent + "%")
            })
        })

        presaleContract.methods.getCurrentRate().call().then(res => {
            currentRate = res;
            if (isBnbFocus) {
                var bnb = $('#input-bnb').val();
                $('#input-jus').val(bnb * currentRate);
            } else {
                var jus = $('#input-jus').val();
                $('#input-bnb').val(jus / currentRate);
            }
        })

        if (currentAddr != null && currentAddr != undefined && currentAddr != "") {
            presaleContract.methods.totalPurchasedToken(currentAddr).call().then(amount => {
                presaleContract.methods.isOpenForClaim().call().then(opened => {
                    if (opened == true) {
                        $('#jus-locked').text(0);
                        $('#jus-avaiable').text(amount / 1e9);
                    } else {
                        $('#jus-avaiable').text(0);
                        $('#jus-locked').text(amount / 1e9);
                    }
                });
            });
        }
    }
}


var currentRate = 0;
var isBnbFocus = true;

$('#input-bnb').on('input', function() {
    isBnbFocus = true;
    var bnb = $('#input-bnb').val();
    $('#input-jus').val(bnb * currentRate);
});

$('#input-jus').on('input', function() {
    isBnbFocus = false;
    var jus = $('#input-jus').val();
    $('#input-bnb').val(jus / currentRate);
});

$("#btn-buy").click(() => {
    try {
        if (presaleContract && currentAddr != null && currentAddr != undefined && currentAddr != "") {
            presaleContract.methods.buyToken().send({
                value: $('#input-bnb').val() * 1e18,
                from: currentAddr,
            })
        }
    } catch (error) {
        console.log(error);
    }
})

$("#btn-claim").click(() => {
    try {
        if (presaleContract && currentAddr != null && currentAddr != undefined && currentAddr != "") {
            presaleContract.methods.claim().send({
                value: 0,
                from: currentAddr,
            })
        }
    } catch (error) {
        console.log(error);
    }
})