		//addPlug(5,6);
//Positions of all the plugs (ish)
var plug_poses=[[91.5,88.125], [189.5,88.125], [282.5,88.125], [379.5,88.125], [479.5,88.125], [574.5,88.125], [669.5,88.125], [762.5,88.125], [862.5,88.125],
					[137.5,163.125], [229.5,163.125], [327.5,163.125], [425.5,163.125], [523.5,163.125], [621.5,163.125], [719.5,163.125], [817.5,163.125],
					[85.5,250],	[183.5,250],	[281.5,250],	[379.5,250],	[477.5,250],	[575.5,250],	[673.5,250],	[771.5,250],	[869.5,250]];
var letter_order = "QWERTZUIOASDFGHJKPYXCVBNML";				
var dist = 110;

var node_init_string = "Drag me to a socket!";
var colors = ["#890d0d","#89480d","#89860d","#3c890d","#0d8978","#0d3a89","#0d1189","#420d89","#7e0d89","#890d0d","#0d8932","#0d8982"];
// create an array with nodes
var nodes = new vis.DataSet([
{id: 1,title:node_init_string,physics:false},
{id: 2,title:node_init_string,physics:false},
{id: 3,title:node_init_string,physics:false},
{id: 4,title:node_init_string,physics:false}
]);

// create an array with edges
var edges = new vis.DataSet([
{id:1, from: 1, to: 2, repulsion:{nodeDistance:0},barnesHut:{springLength:2000,gravitationalConstant:100},length:900},
{id:2, from: 3, to: 4, repulsion:{nodeDistance:0},barnesHut:{springLength:2000,gravitationalConstant:100},length:900},
]);

// create a network
var container = document.getElementById('plugboard');
var data = {
nodes: nodes,
edges: edges
};
var options = {nodes:{shape:'image', borderWidth:4, image:"images/plug.png"},
					physics:{enabled:true},
					interaction:{dragView:false,zoomView:false},
					edges:{width:5,selectionWidth:6},
					layout:{hierarchical:{enabled:102}}};
var network = new vis.Network(container, data, options);

//Only runs at the start of the network, randomly places the plugs in sockets
var done = false;
network.on("afterDrawing",function(ctx){
	if (!done){
		network.moveTo({position:{x:-3.988492385495591,y:0.5159607990274256},scale:1});
		let i=0;
		for(i=1;i<=4;i+=2){
			addPlug(i,i+1);
		}

	}

	//network.moveTo(options:{postion:{x:0,y:0}});
	done = true;
	//Drawing letters over plugs.
	let x = get_plugboard_state();
	let i = 0;

	for(i=1;i<=x.length*2;i++){
		let index = (i%2==0) ? (i/2)-1:Math.floor(i/2);
		let pair = x[index];
		var nodePosition = network.getPositions([i]);
		console.log(nodePosition);
	    ctx.font = "20px Arial";
	    ctx.fillStyle=colors[index+1];
		ctx.fillText(pair[0]+"-"+pair[1], nodePosition[i].x-17, nodePosition[i].y-35);
		ctx.fill();
		ctx.stroke();
	}
});

network.on("dragEnd", function (params) {
		let node_id = params.nodes[0];
		if(node_id>0){
			let x=params["pointer"]["DOM"]["x"];
			let y=params["pointer"]["DOM"]["y"];
			let last_drop_char = move_plugs(node_id,x,y);
			nodes.update({id:node_id,title:last_drop_char}); // update title of this node.
		}
    });

function addPlug(id1,id2){
	nodes.update({id: id1,title:node_init_string,physics:false});
	nodes.update({id: id2,title:node_init_string,physics:false});
	edges.update({id: id2/2, from: id1, to: id2, color:{color:colors[id2/2]},  repulsion:{nodeDistance:0},barnesHut:{springLength:2000,gravitationalConstant:100},length:900},)

	let pos = network.getPositions([id1,id2]);	
	let pos_1 = network.canvasToDOM(pos[id1]);
	let pos_2 = network.canvasToDOM(pos[id2]);

	let last_drop_char = move_plugs(id1,pos_1.x,pos_1.y);
	nodes.update({id:id1,title:last_drop_char});

	let last_drop_char_2 = move_plugs(id2,pos_2.x,pos_2.y);
	

	nodes.update({id:id2,title:last_drop_char_2});

}

/* Moves the one plug at node_id to the nearest socket.
@return The letter of the socket that the plug was dropped inot
*/
function move_plugs(node_id,x,y){
	let min=Number.MAX_SAFE_INTEGER;
	var min_idx = 0;
	var i = 0;
	for(i=0;i<plug_poses.length;i++){
		let dist = Math.pow(x-plug_poses[i][0],2) + Math.pow(y-plug_poses[i][1],2);
		if (dist<min && isPlugTaken(letter_order.charAt(i),get_plugboard_state())){
			min=dist;
			min_idx=i;
		}
	}
	let dict = {x:plug_poses[min_idx][0],y:plug_poses[min_idx][1]};
	let pos = network.DOMtoCanvas(dict);
	network.moveNode(node_id,pos.x,pos.y);
	return letter_order.charAt(min_idx);
}

function isPlugTaken(plug_let,board_state){
	let out =  !board_state.some(row=>row.includes(plug_let));
	return out;
}

/* Outputs the pairs in the plugboard. 
*/
function get_plugboard_state(){
	var edge_list = edges.get();
	var arr = [];
	var i;
	for(i=0;i<edges.length;i++){
		let from = edge_list[i].from;
		let to = edge_list[i].to;

		let from_node = nodes.get(from);
		let to_node = nodes.get(to);
		arr.push([from_node.title,to_node.title]);
	}
	return arr;
}
//Where the HTML onClick goes to to add a plug
function UI_addPlug(){
	if(nodes.length<22){addPlug(nodes.length+1,nodes.length+2)}else{alert("11 cables is the maximum secure value, adding more would decrease the machine's complexity.");}
}

function removePlug(){
	let len = nodes.length;
	if(len>2){
		nodes.remove([len,len-1]);
		edges.remove([edges.length]);
	} else{alert("Must have at least one plug!");}
}
