$(document).ready(function() {
    activateCardano();
    $("#connectBtn").click(function() {
        activateCardano();
    })
});

async function getBalance() {
    cardano.getUsedAddresses().then(function(result) {
        console.log(cbor.decode(result))
    })
}

async function activateCardano() {
    try {
        const promise = await cardano.enable()
        if (cardano.isEnabled()) {
            $("#connectBtn").text('Connected');
            $("#connectBtn").attr('class', 'btn btn-success');
        } else {
            $("#connectBtn").text('Click to connect');
            $("#connectBtn").attr('class', 'btn btn-dark');
        }
    } catch (error) {
        $("#connectBtn").text('Install Nami Wallet');
        $("#connectBtn").attr('class', 'btn btn-danger');
    }
}