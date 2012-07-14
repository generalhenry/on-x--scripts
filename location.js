/*global device:true */
console.log('Started Script: ' + device.currentSource);

if (!(device.version && device.version.isSupported(0, 54))) {

    var notification = device.notifications.createNotification('on{X} is out of date');
    notification.content = "the recipe '" + device.currentSource + "' requires an up to date on{X} application.";
    notification.show();
    console.log('fail');
} else {
  monitorRegions();
  scanOnCharging();
}

console.log('Completed Script: ' + device.currentSource);

function scanOnCharging () {
    var listener = device.location.createListener('HYBRID', 5000);
    device.battery.on('startedCharging', listener.start);
    device.battery.on('stoppedCharging', listener.stop);
    console.log('Scaning on changes');
}

function monitorRegions () {
    
    var regions = [
        device.regions.createRegion({
            latitude: 37.2954177856445,
            longitude: -122.033226013184,
            name: 'work',
            radius: 500
        }),
        device.regions.createRegion({
            latitude: 37.3291549682617,
            longitude: -121.897117614746,
            name: 'home',
            radius: 500
        }),
        device.regions.createRegion({
            latitude: 37.2956924438477,
            longitude: -121.897117614746,
            name: 'fortune',
            radius: 500
        }),
        device.regions.createRegion({
            latitude: 37.402994,
            longitude: -122.016671,
            name: 'tilford',
            radius: 500
        })
    ].forEach(device.regions.startMonitoring);
        
    device.regions.on('enter', onEnter);
    device.regions.on('exit', onExit);
    
    var listener = device.location.createListener('GPS', 5000); 
    listener.once('changed', checkInitLocation);
    listener.start();
    
    function checkInitLocation (signal) {
        listener.stop();
        return device.regions.getAll().forEach(checkInitRegion);
        
        function checkInitRegion (region) {
            if (signal.location.latitude.toFixed(2) === region.latitude.toFixed(2) &&
                signal.location.longitude.toFixed(2) === region.longitude.toFixed(2)) {
                console.log('Start location: ' + region.name);
                onEnter({name: region.name});
            }
        }
    }
    
    console.log('monitering regions');
}

function sendMessage (to, message) {
    return device.messaging.sendSms({
        to: to.number,
        body: message
    }, function (error) {
        if (error) {
            console.error('Message fail to send: ' + message);
            return console.error('Error: ' + JSON.stringify(error));
        }
        return console.log('Message: "' + message + '" sent to ' + to.name);
    });   
}

function sendToVictoria (message) {
    var victoria = {
        name: 'Victoria',
        number: '+1(408)466-4989'
    };
    return sendMessage(victoria, message);
}

function onEnter (signal) {
    console.log('arrived at ' + signal.name);
    var enterActions = {
        'work': arrivedWork,
        'home': arrivedHome,
        'fortune': arrivedFortune
    };
    device.network.wifiEnabled = true;
    return enterActions[signal.name] && enterActions[signal.name]();
}

function onExit (signal) {
    console.log('left ' + signal.name);
    var exitActions = {
        'work': leftWork,
        'fortune': leftFortune
    };
    device.network.wifiEnabled = false;
    return exitActions[signal.name] && exitActions[signal.name]();
}

function arrivedWork () {
    var appName = "calendar";
    return device.applications.launch(appName, {}, function (error) {
        if (error) {
            return console.error('failed to launch app ' + 
              appName + ', please verify the application name;' + error);
        }
        console.log(appName + ' lauched');
    });
}

function arrivedHome () {
    return sendToVictoria('I\'m home');
}

function arrivedFortune () {
    return sendToVictoria('Let me in!');
}

function leftWork () {
    return sendToVictoria('I\'m done with work');
}

function leftFortune () {
    return sendToVictoria('kthxbai');
}