//Sources:
//http://www.alanturing.net/turing_archive/archive/b/B05/B05-001.html
//http://www.codesandciphers.org.uk/enigma/index.htm

var enigmaMachine = -1;
var logging = true;
window.onload = function(){
	let ROTR = new Rotor(RotorSelection.ROTOR_3);
	let ROTM = new Rotor(RotorSelection.ROTOR_2);
	let ROTL = new Rotor(RotorSelection.ROTOR_1);

	let REFLC = new Reflector(ReflectorPerms.REFLECTOR_B);

	enigmaMachine = new EnigmaMachine(ROTR,ROTM,ROTL,REFLC);

	//Adding Rotor names in HTML page
	var x = document.getElementsByClassName("order_dropdown");
	var list = ["I","II","III","IV"];
	var i;
	var z;
	for(i=0;i<x.length;i++){
		for(z=0;z<list.length;z++){
			var opt = document.createElement('option');
			opt.appendChild( document.createTextNode(list[z]) );
			opt.value = RotorSelection["ROTOR_"+(z+1)]; 

			x[i].appendChild(opt); 
		}
		x[i].selectedIndex=i; // set default values to be III,II,I
	}
	
};

const RotorSelection = {
	ROTOR_1:'ROTOR_1',
	ROTOR_2:'ROTOR_2',
	ROTOR_3:'ROTOR_3',
	ROTOR_4:'ROTOR_4'
}

const RotorPerms = {
    ROTOR_1: ['.', 'E', 'K', 'M', 'F', 'L', 'G', 'D', 'Q', 'V', 'Z', 'N', 'T', 'O', 'W', 'Y', 'H', 'X', 'U', 'S', 'P', 'A', 'I', 'B', 'R', 'C', 'J'],
    ROTOR_2: ['.', 'A', 'J', 'D', 'K', 'S', 'I', 'R', 'U', 'X', 'B', 'L', 'H', 'W', 'T', 'M', 'C', 'Q', 'G', 'Z', 'N', 'P', 'Y', 'F', 'V', 'O', 'E'],
    ROTOR_3: ['.', 'B', 'D', 'F', 'H', 'J', 'L', 'C', 'P', 'R', 'T', 'X', 'V', 'Z', 'N', 'Y', 'E', 'I', 'W', 'G', 'A', 'K', 'M', 'U', 'S', 'Q', 'O'],
    ROTOR_4: ['.', 'E', 'S', 'O', 'V', 'P', 'Z', 'J', 'A', 'Y', 'Q', 'U', 'I', 'R', 'H', 'X', 'L', 'N', 'F', 'T', 'G', 'K', 'D', 'C', 'M', 'W', 'B']
}

const RotorCarryPos = { // The point in the rotor where we carry the movement to the next rotor.
	ROTOR_1:'R',
	ROTOR_2:'F',
	ROTOR_3:'W',
	ROTOR_4:'K'
}

const ReflectorPerms = {
	REFLECTOR_B: [[','], ['A','Y'],	['B','R'],	['C','U'],	['D','H'],	['E','Q'],	['F','S'],	['G','L'],	['I','P'],	['J','X'],	['K','N'],	['M','O'],	['T','Z'],	['V','W']],
	REFLECTOR_C: [[','], ['A','F'],	['B','V'],	['C','P'],	['D','J'],	['E','I'],	['G','O'],	['H','Y'],	['K','R'],	['L','Z'],	['M','X'],	['N','W'],	['T','Q'],	['S','U']]
}
//Run this whenever there is a change in the Enigma Machines rotor positions, updates teh UI to match. 
function updateRotorWindows(){
	let x = enigmaMachine.readRotorWindow("all");
	var i; 
	for(i=1;i<=3;i++){
		document.getElementById("window_"+i).innerHTML=String.fromCharCode(x[i-1]+65);
	}
}
//Run this whenever there is a change in the Enigma Machines Rotor Offsets, updates teh UI to match. 
function updateRotorOffsets(){
	let x = enigmaMachine.readRingOffset("all");
	var i; 
	for(i=1;i<=3;i++){
		document.getElementById("offset_"+i).innerHTML=String.fromCharCode(x[i-1]+65);
	}
}
var down = -1;
document.addEventListener('keydown', function(event) {
    if (event.keyCode > 64 && event.keyCode <= 64+26 && down == -1) {
    		document.getElementById("log_list").innerHTML="";
    		down=event.keyCode;
			var key=enigmaMachine.pressKey(event.keyCode);
			document.getElementById("key_"+key).className = "key-pressed";
			updateRotorWindows();
			//add both letters to boxes
			document.getElementById('out_top').value += String.fromCharCode(down);
			document.getElementById('out_bot').value += String.fromCharCode(key);
    }

}, true);
document.addEventListener('keyup', function(event) {
    if (event.keyCode > 64 && event.keyCode <= 65+26 && down==event.keyCode) {
		document.getElementById("key_"+enigmaMachine.getLastKeyOut()).className="key-depressed";
    	down=-1;
    }

}, true);

class EnigmaMachine {
	constructor(ROTR,ROTM,ROTL,REFLC){
		this.ROTR=ROTR;
		this.ROTM=ROTM;
		this.ROTL=ROTL;
		this.REFLC=REFLC;
		this.lastKey=-1;
	}
	//Presses a key on the machine, then returns which key lights up.
	pressKey(key){
		if(this.ROTR.advanceRotor()){if(this.ROTM.advanceRotor()){this.ROTRL.advanceRotor();}}
		let letter = plugboard_transform(key-64) // First plugboard translation and convert to 1-26 range
		makeLog("\nEnigma Machine: Encoding "+String.fromCharCode(letter+64));
		let first = this.ROTL.translate(this.ROTM.translate(this.ROTR.translate(letter)));
		let ref = this.REFLC.translate(first);
		let last = this.ROTR.translate(this.ROTM.translate(this.ROTL.translate(ref,true),true),true);

		let ret = plugboard_transform(last)+64; //final plugboard and convert to ASCII.

		this.lastKey=ret;//For UI.
		return ret;
	}
	getLastKeyOut(){
		return this.lastKey;
	}
	//Rotors left, middle and right. use "all" to get [L,M,R]
	readRotorWindow(rotor_pos){
		switch(rotor_pos){
			case "right":
				return this.ROTR.readRotorWindow();
				break;
			case "middle":
				return this.ROTM.readRotorWindow();
				break;
			case "left":
				return this.ROTL.readRotorWindow();
				break;
			case "all":
				return [this.ROTL.readRotorWindow(),this.ROTM.readRotorWindow(),this.ROTR.readRotorWindow()];
				break;
		}
	}
	//Reads offset values
	readRingOffset(rotor_pos){
		switch(rotor_pos){
			case "right":
				return this.ROTR.readRingOffset();
				break;
			case "middle":
				return this.ROTM.readRingOffset();
				break;
			case "left":
				return this.ROTL.readRingOffset();
				break;
			case "all":
				return [this.ROTL.readRingOffset(),this.ROTM.readRingOffset(),this.ROTR.readRingOffset()];
				break;
		}
	}

	getRotor(rotor_pos){
		switch(rotor_pos){
			case "right":
				return this.ROTR;
				break;
			case "middle":
				return this.ROTM;
				break;
			case "left":
				return this.ROTL;
				break;
		}
	}

	getReflector(){return this.REFLC;}
}

/*Converts to ASCII character, wrapping around the alphabet like a ring. 
	@param letter: input letter between 1 and 26
*/
function validAlphabet(letter){
	if(letter>26){
		return letter-26;
	}else if(letter<=0){
		return letter+26;
	}else{
		return letter;
	}
}
function makeLog(txt){
	if(logging){console.log(txt);}

	var node = document.createElement("LI");
	var textnode = document.createTextNode(txt);
	node.appendChild(textnode);
	document.getElementById("log_list").appendChild(node);

}
/* Need to look at letters near end of alphabet not working with the last out-this.bias.
*/
class Rotor {
	//Rotor type should be of type RotorPerms - one of teh constants from there
	//Bias is the initial state of the rotor. 
	constructor(rotorselect, bias=0, ringoffset=0){
		this.rotorperms=RotorPerms[rotorselect];//Permuation array
		this.rotorselect=rotorselect;//Identifier for what type of rotor
		this.bias = bias;
		this.ringoffset=ringoffset;
	}
	translate(letter,backwards=false){
		let perms = (backwards) ? invertSet(this.rotorperms) : this.rotorperms;

		let out = validAlphabet(letter+this.bias);
		out = validAlphabet(out-this.ringoffset);
		out = validAlphabet(perms[out].charCodeAt(0)-64);
		out = validAlphabet(out-this.bias);
		out = validAlphabet(out+this.ringoffset);
		
		makeLog("Rotor translated from: "+String.fromCharCode(letter+64)+" to "+String.fromCharCode(out+64)+". walzen(rotor): "+this.rotorselect+", grundstellung(start pos): "+this.bias+", ringstellung(offset): "+this.ringoffset+", inverse: "+backwards);
		return out;
	}
	advanceRotor(){// Returns true if the movment should be carried to next rotor.
		makeLog("Adnvancing rotor: "+this.rotorselect)
		if (this.bias<25) {this.bias+=1;} else {this.bias=0;}
		if(this.bias==RotorCarryPos[this.rotorselect].charCodeAt(0)-65){
			return true;
		}
		return false;
	}
	//Walzengalde change the type of rotor in this slot. 
	changeRotor(rotorselect){
		this.rotorselect=rotorselect;
		this.rotorperms=RotorPerms[rotorselect];
	}
	readRotorWindow(){return this.bias;}
	readRingOffset(){return this.ringoffset;}
	//Grundstellung Used for the + and - buttons, NOT for advancing the rotor during simulation.
	incrementRotor(){if(this.bias<25){this.bias+=1;}else{this.bias=0;}}
	decrementRotor(){if(this.bias>0){this.bias-=1;}else{this.bias=25;}}

	//Ringstellung
	incrementOffset(){if(this.ringoffset<25){this.ringoffset+=1;}else{this.ringoffset=0;}}
	decrementOffset(){if(this.ringoffset>0){this.ringoffset-=1;}else{this.ringoffset=25;}}

}

//Inverts the permutation set for backwards traversal
//Will only work where the array indicies represent the plaintext, i.e. 012345, abcdef...
function invertSet(set){
	var arr = [];
	arr.push(['.']);
	var i = 1;
	for(i = 1; i<set.length; i++){
		var y = 1;
		for(y = 1; y<set.length; y++){
			if(i==set[y].charCodeAt(0)-64){ // found equal
				// append i to output
				arr.push(String.fromCharCode(y+64));
			}
		}
	}

	return arr;
}
class Reflector {
	constructor(reflcperms){
		this.reflcperms=reflcperms;
	}
	translate(letter){
		var i;
		let perms = this.reflcperms;
		for(i = 1; i < perms.length; i++){
			if(perms[i][0].charCodeAt(0)-64==letter){ // if first element is equal
				makeLog("Reflecting signal: "+String.fromCharCode(letter+64)+" to "+perms[i][1]);
				return perms[i][1].charCodeAt(0)-64;
			}
			if(perms[i][1].charCodeAt(0)-64==letter){
				makeLog("Reflecting signal: "+String.fromCharCode(letter+64)+" to "+perms[i][0]);
				return perms[i][0].charCodeAt(0)-64;
			}
		}
		return -1;
	}
	changeType(reflcperms){this.reflcperms=reflcperms;}
}

function plugboard_transform(letter){
	let arr = get_plugboard_state();
	var i;
	for(i = 0; i < arr.length; i++){
		if(arr[i][0].charCodeAt(0)-64==letter){ // if first element is equal
			makeLog("Plugboard translation from "+String.fromCharCode(letter+64)+" to "+arr[i][1]);
			return arr[i][1].charCodeAt(0)-64;
		}
		if(arr[i][1].charCodeAt(0)-64==letter){
			makeLog("Plugboard translation from "+String.fromCharCode(letter+64)+" to "+arr[i][0]);
			return arr[i][0].charCodeAt(0)-64;
		}
	}
	//makeLog(String.fromCharCode(letter+64)+" is not connected on the plugboard, no translation.");
	return letter;
}

//Grundstellung Ran whenever a + or - button is pressed. Updates machine to match.
function changeRotorBias(id){
	let rotor_pos = id.substr(1);
	if(id.charAt(0)==="+"){
		enigmaMachine.getRotor(rotor_pos).incrementRotor();
	}else{
		enigmaMachine.getRotor(rotor_pos).decrementRotor();
	}
	updateRotorWindows();
}
//Ringstellung
function changeRotorOffset(id){
	let rotor_pos = id.substr(2);
	if(id.charAt(1)==="+"){
		enigmaMachine.getRotor(rotor_pos).incrementOffset();
	}else{
		enigmaMachine.getRotor(rotor_pos).decrementOffset();
	}
	updateRotorOffsets();
}
//Walzenloge
function changeRotorPositions(rotor_pos,new_rot){
	enigmaMachine.getRotor(rotor_pos).changeRotor(new_rot);
}

function changeReflector(new_reflc){
	enigmaMachine.getReflector().changeType(ReflectorPerms["REFLECTOR_"+new_reflc]);
}

function clearOutput(){
	document.getElementById("out_top").value="";
	document.getElementById("out_bot").value="";
}
function copyOutput(){
  var copyText = document.getElementById("out_bot");
  copyText.select();
  document.execCommand("copy");
  alert("Copied output: " + copyText.value);

}
