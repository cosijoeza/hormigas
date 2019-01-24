function colonia()
{
	/*Leo valores de las entradas*/
	let hormigueros = document.getElementById("hormigueros").value;
	let knn = document.getElementById("knn").value;
	let hormigas = document.getElementById("hormigas").value;
	INFINITY = 10000;
	/*let hormigueros = 6;
	let knn = 6;
	let hormigas = 60;*/
	
	//De aquí salen las hormigas
	let inicio = parseInt(Math.random() * hormigueros); 
	//Rutas de las hormigas
	let rutas = new Array();
	//Camino que tendra cada hormiga
	var camino = null;	//{ruta:[], costo}
	//Vector que nos indica los hormigueros que ya han sido visitados
	let visitados = new Array(hormigueros);
		for(let i=0;i<hormigueros;i++){visitados[i] = 0;}
	//Mejor hormiga de cada colonia
	var best_ant = new Object();
	//Mejor ruta de todas las colonias
	best_route = new Object();
	//Mapa global para conjunto de coordenadas de los hormigueros
	mapa = new Array();
	//Canvas donde se mostrara la gráfica
	canvas = document.getElementById("canvas").getContext("2d");

	//**Inicializamos los elementos**//
	mapa = points(hormigueros);
	distancias = distance(mapa,hormigueros,knn);
	tau = tau_(distancias,hormigueros);
	var mejores = new Array();
	console.log("Puntos");
	console.log(mapa);

	//Dibujamos hormigueros
	dibuja();

	//Iteramos
	for(var iteracion = 0; iteracion < 10; iteracion++)
	{
		//Para cada hormiga h-
		for(var h = 0; h < hormigas; h++)
		{
			camino = {ruta: [], costo:0};
			//Guardamos y marcamos como visitado el hormiguero inicial
			camino.ruta.push(inicio);		 
			visitados[inicio] = 1;
			var posicion = inicio;
			//*-Recorre todos los hormigueros-
			for(j = 0; j < (hormigueros-1);j++)
			{
				let new_destiny = visitar(distancias[posicion],tau[posicion],visitados);
				camino.ruta.push(new_destiny);
				visitados[new_destiny] = 1;
				posicion = new_destiny;
			}
			camino.costo = funcionObjetivo(camino.ruta,distancias,hormigueros);
			rutas.push(camino);
			//Reiniciamos los valores visitados para otra hormiga
			for(let i=0;i<hormigueros;i++){visitados[i] = 0;}
		}
		//Ordeno las rutas para costos de menos a mayor
		rutas.sort( function(a,b){ return a.costo - b.costo; });

		//**Actualización de feromonas*
		var Q = 1;
		for(var i = 0; i < hormigas;i++)
		{
			var camino = new Object();
			camino = rutas[i];
			var incremento = Q / camino.costo;
			for( j = 0; j < (hormigueros-1); j++ )
			{
				tau[ camino.ruta[j] ][ camino.ruta[j+1] ] = tau[ camino.ruta[j] ][ camino.ruta[j+1] ] + incremento;  
			}
			tau[ camino.ruta[0] ][ camino.ruta[hormigueros-1] ] = tau[ camino.ruta[0] ][ camino.ruta[hormigueros-1] ] + incremento;
		}

		//Mejor poblador		
		best_ant = rutas[0];
		//Almacenamos mejor poblador
		mejores.push(best_ant);
		//Reiniciamos vector de rutas para nuevo conjunto de hormigas
		rutas = new Array();
	}
	mejores.sort( function(a,b){ return a.costo - b.costo;} );
	best_route = mejores[0];
	dibuja_mejor();
	console.log("Mejores rutas de cada colonia");
	console.log(mejores);
	console.log("Mejor ruta de todas");
	console.log(best_route);
}

//*-Crea puntos con coordenadas [x,y] aleatorias en un rango [0,100]-*
function points(hormigueros)
{
	//Mapa de puntos
	let map = new Array();
	//Limite de plano carteciano en [X,Y]
	let limite = 100;
	//Genero hormigueros (puntos)
	for(var i=0; i < hormigueros; i++)
	{
		var punto = new Object();
		punto.x = parseInt(Math.random() * limite);
		punto.y = parseInt(Math.random() * limite);
		map.push(punto);
	}
	return map;
}

//*-A partir del mapa de puntos calculo las distancias entre ellos-*
function distance(map,hormigueros,knn)
{
	var distancias = new Array(hormigueros);
	for(var i = 0; i < hormigueros;i++)
	{distancias[i] = new Array(hormigueros);}
	
	for(var i = 0; i < hormigueros; i++)
	{
		ordenados = new Array;
		//0 en la diagonal
		distancias[i][i] = 0;
		//Calculo la distancia de cada punto con los demas
		for(j = (i+1); j < hormigueros; j++)
		{
			//euclidian_distance recibe (x2,y2,x1,y1)
			distancias[i][j] = euclidian_distance(map[j].x,map[j].y,map[i].x,map[i].y);
			distancias[j][i] = distancias[i][j];
		}
	}
	//Calculo los k hormigueros más cercanos 
	distancias = knn_(distancias,hormigueros,knn);
	//************************GRAFICAR LOS PUNTOS*****************************//

	//Poner los vecinos más lejanos en INFINITO
	for(var i = 0; i < hormigueros; i++)
	{
		for(j=0; j < hormigueros; j++)
		{
			if(distancias[i][j] == 0){distancias[i][j] = INFINITY;}	
		}
	}
	return distancias;
} 

//Calcula la distancia entre dos puntos
function euclidian_distance(x2,y2,x1,y1)
{
	suma =  Math.pow( x2-x1,2 ) + Math.pow( y2-y1,2 );
	return Math.sqrt(suma);
}


//Dejamos los k vecinos más cercanos a cada hormiguero
function knn_(distancias,hormigueros,knn)
{
	var ordenados;
	for(var i=0; i < hormigueros; i++)
	{
		ordenados = new Array();
		//Creo una lista de objetos para cada renglon i
		//Guardo la distancia e indice. 
		//AL MOMENTO DE ORDENAR NO PERDER SU POSICION ORIGINAL
		for(j = 0; j < hormigueros; j++)
		{	
			var elemento = new Object();
			//Posicion
			elemento.pos = j;
			//Distancia	
			elemento.valor = distancias[i][j];
			ordenados.push( elemento );
		}
		//Ordeno de acuerdo a la distancia
		ordenados.sort(function(a,b){return a.valor-b.valor});

		//Deja la distancia de los knn (k vecinos más cercanos) en matriz de distancias
		for(j = (knn + 1); j < hormigueros; j++ )
		{
			distancias[i][ordenados[j].pos] = 0;
		}
	}
	return distancias;
}


function tau_(distancias,hormigueros)
{
	var sum = 0;
	var tau = new Array(hormigueros);
	for(var i = 0; i < hormigueros; i++)
		{tau[i] = new Array(hormigueros);}

	//Cuantas ciudades son diferentes de INFINITY  
	distancias.forEach(
		function(fila)
		{
			fila.forEach(
				function(columna){ if(columna != INFINITY ){sum++;} }
			)
		}
	)
	//**Calculo las probabilidades para tau**//
	for(var i = 0; i < hormigueros; i++)
	{
		for(var j = 0; j < hormigueros; j++)
		{
			if(distancias[i][j] < INFINITY){ tau[i][j] = 1 / sum; }
			else{ tau[i][j] = 0; }
		}
	}
	return tau;
}
//**Calcula la distancia total recorrida de un camino. Suma las distancias de la matriz**//
function funcionObjetivo(camino,distancias,hormigueros)
{
	var distancia = 0;
	for(var i = 0; i < (hormigueros - 1); i++)
		{ distancia += distancias[ camino[i] ][ camino[i+1] ]; }
	distancia += distancias[ camino[0] ][ camino[hormigueros-1] ];
	return distancia;
}

//**Nos devuelve la ciudad que es mejor visitar**//
function visitar(distancias,tau,visitados)
{
	var no_visitados = new Array();
	var acomulado = new Array();
	var productos = new Array(hormigueros);
	var ordenados = new Array();
	var ruleta = new Array();
	var hormigueros = distancias.length;
	var num_productos = 0;
	var num_noVisitados = 0;
	var sumRuleta = 0;
	var dardo;
	var indice;
	//**Calculo la probabilidad de la distancia de los que no han sido visitados**//
	for(var i = 0; i < hormigueros; i++)
	{
		var elemento = new Object();
		productos[i] = tau[i] * distancias[i] * (1 - visitados[i]);
		elemento.pos = i;
		elemento.valor = productos[i];
		if(productos[i] != 0){num_productos++;}
		ordenados.push(elemento);
	}
	//**Ordeno las distancias de menor a mayor sin perder su posición**//
	ordenados.sort( function(a,b){ return a.valor - b.valor; } );
	//**Genero ruleta, acomulado de ruleta y suma de todos los valores de ruleta**//
	//console.log("ordenados");
	//console.log(ordenados);
	for(var i = 0; i < hormigueros; i++)
	{
		if(ordenados[i].valor != 0)
		{ 
			ruleta.push( (1.0 * num_productos) / (i+1) );	//1.0 para hacerlo flotante 
		}else{ ruleta.push( ordenados[i].valor ); }
		sumRuleta += ruleta[i];
		acomulado.push(sumRuleta);
	}
	//**Busco un dardo en una ruleta**//
	if(sumRuleta > 0)
	{
		dardo = Math.random() * sumRuleta;
		for(var i = 0; i < hormigueros; i++)
		{
			if(dardo <= acomulado[i])
				{ indice = i; break; }
		}
		indice = ordenados[indice].pos;
	}else
	{
		for(var i = 0; i < hormigueros; i++)
		{
			if(visitados[i] == 0)
			{ 
				no_visitados.push(i); 
				num_noVisitados++;
			}
		}
		indice = parseInt( Math.random() * num_noVisitados ); //**[0,noVisitados-1]**//
		indice = ordenados[no_visitados[indice] ].pos;
	}
	return indice;
}

function dibuja()
{
	canvas.clearRect(0,0,canvas.width,canvas.height);
	var hormigueros = mapa.length;
	var radio = 5;
	var padding = 20;
	var separacion = 6;
	//--Dibujo los vertices. Todos contra todos--//
	canvas.strokeStyle = "rgb(107,13,13)";
	for(var i = 0; i < hormigueros; i++)
	{
		for(var j = 0; j < hormigueros; j++)
		{
			canvas.beginPath();
				canvas.moveTo(padding + mapa[i].x * separacion,padding + mapa[i].y * separacion);
				canvas.lineTo(padding + mapa[j].x * separacion,padding + mapa[j].y * separacion);
			canvas.stroke();
		}		
	}
	//--Dibujo el mapa de puntos--//
	canvas.fillStyle = "rgb(0,0,0)";
	for(var i = 0; i < hormigueros; i++)	
	{
		canvas.beginPath();
		canvas.arc(padding + mapa[i].x * separacion,padding + mapa[i].y * separacion,radio,0,Math.PI*2);
		canvas.fill();
	}
}
function dibuja_mejor()
{
	var hormigueros = mapa.length;
	var radio = 5;
	var padding = 20;
	var separacion = 6;
	//--Dibujo los vertices. Todos contra todos--//
	canvas.strokeStyle = "rgb(0,255,0)";
	for(var i = 0; i < (hormigueros-1); i++)
	{
		canvas.beginPath();
			canvas.moveTo(padding + mapa[ best_route.ruta[i] ].x * separacion,padding + mapa[best_route.ruta[i]].y * separacion);
			canvas.lineTo(padding + mapa[ best_route.ruta[i+1] ].x * separacion,padding + mapa[ best_route.ruta[i+1] ].y * separacion);
		canvas.stroke();		
	}
	/*//Linea final
	canvas.beginPath();
			canvas.moveTo(padding + mapa[ best_route.ruta[0] ].x * separacion,padding + mapa[best_route.ruta[0]].y * separacion);
			canvas.lineTo(padding + mapa[ best_route.ruta[hormigueros-1] ].x * separacion,padding + mapa[ best_route.ruta[hormigueros-1] ].y * separacion);
	canvas.stroke();*/


	//--Inicio--//
	canvas.fillStyle = "rgb(255,0,0)";
	canvas.beginPath();
		canvas.arc(padding + mapa[ best_route.ruta[0] ].x * separacion,padding + mapa[ best_route.ruta[0] ].y * separacion,radio,0,Math.PI*2);
	canvas.fill();
	//Final
	canvas.fillStyle = "rgb(0,0,255)";
	canvas.beginPath();
		canvas.arc(padding + mapa[ best_route.ruta[hormigueros-1] ].x * separacion,padding + mapa[ best_route.ruta[hormigueros-1] ].y * separacion,radio,0,Math.PI*2);
	canvas.fill();

	//Puntos
	//--Dibujo el mapa de puntos--//
	canvas.fillStyle = "rgb(0,0,0)";
	for(var i = 0; i < hormigueros; i++)	
	{
		canvas.beginPath();
		canvas.arc(padding + mapa[i].x * separacion,padding + mapa[i].y * separacion,radio,0,Math.PI*2);
		canvas.fill();
	}
}