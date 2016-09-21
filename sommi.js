!function() {
	/******** architecture  part*********/
	var globalObj = this;
	var originalS = globalObj.S;

	function Sommi(obj) {
		this.primitiveObj = obj;
	}
	var S = globalObj.S = function(obj) {
		return new Sommi(obj);
	}

//export the S object for CommonJS
	if(typeof exports!=="undefined") exports.S=S;
	
	S.version = "0.1.0";
	/*******************Internal functions*************/
	var isArrayLike = function(obj) {
		var len = obj.length;
		return typeof len === 'number' && len >= 0;
	}


	/**************Collection functions**************/
	S.each = function(collection, fn, thisArg) {
		//try-catch used for breaking loop
		try {
			if (Array.prototype.forEach&&collection.forEach===Array.prototype.forEach) {
				collection.forEach(fn, thisArg);
			} else if(S.isNumber(collection.length)) {
				for (var i = 0, len = collection.length; i < len; i++) {
					fn.call(thisArg, collection[i], i, collection);
				}
			}
			else {
				var keys=S.keys(collection),len=keys.length;
				for (var i=0;i<len;i++) {
					fn.call(thisArg, collection[keys[i]], keys[i], collection);
				}
			}
		} catch (error) {
			if (error !== "break") {
				throw error;
			}
		}

	};

	S.map = function(collection, fn, thisArg) {
		if (Array.prototype.map&&collection.map===Array.prototype.map) {
			return collection.map(fn, thisArg);
		}
		var result = new Array();
		S.each(collection, function(value, index, obj) {
			result.push(fn.call(thisArg, value, index, obj));
		}, thisArg);
		return result;
	};

//A convenient version of what is perhaps the most common use-case 
//for map: extracting a list of property values. 
	S.pluck=function(collection,key){
		return S.map(collection,function(value){
			return value[key];
		});
	};

	S.reduce = function(collection, memoValue, fn, thisArg) {
		if (Array.prototype.reduce&&collection.reduce===Array.prototype.reduce) {
			return collection.reduce(S.bind(fn, thisArg), memoValue);
		}
		S.each(collection, function(value, index, obj) {
			memoValue = fn.call(thisArg, memoValue, value, index, obj);
		});
		return memoValue;
	};

	S.reduceRight = function(collection, memoValue, fn, thisArg) {
		if (Array.prototype.reduceRight===collection.reduceRight===Array.prototype.reduceRight) {
			return collection.reduceRight(_.bind(fn, thisArg), memoValue);
		}
		var list = S.toArray(collection).reverse();
		return S.reduce(list, memoValue, fn, thisArg);
	};
	
// Return the first value which passes a truth test.
	S.find = function(collection, fn, thisArg) {
		var result;
		S.each(collection, function(value, index, obj) {
			if (fn.call(thisArg, value, index, obj)) {
				result = value;
				S.breakLoop();
			}
		});
		return result;
	};

// Return all the values that pass a truth test.
	S.filter=function(collection,fn,thisArg){
		if(Array.prototype.filter&&collection.filter===Array.prototype.filter){
			return collection.filter(fn,thisArg);
		}
		var result=new Array();
		S.each(collection,function(value,index,obj){
			fn.call(thisArg,value,index,obj)&&result.push(value);
		});
		return result;
	};

// Return all the values that don't pass the truth test.
	S.reject=function(collection,fn,thisArg){
		var result=new Array();
		S.each(collection,function(value,index,obj){
			!fn.call(thisArg,value,index,obj)&&result.push(value);
		});
		return result;
	};

//Determin whether all the values in the collection pass the truth test
	S.every=function(collection,fn,thisArg){
		if(Array.prototype.every&&collection.every===Array.prototype.every){
			return collection.every(fn,thisArg);
		}
		var booleanResult=true;
		S.each(collection,function(value,index,obj){
			if(!fn.call(thisArg,value,index,obj)){
				booleanResult=false;
				S.breakLoop();
			}
		});
		return booleanResult;
	};

// Determine whether at least one value in the collection passes a truth test.
	S.some=function(collection,fn,thisArg){
		if(Array.prototype.some&&collection.some===Array.prototype.some){
			return collection.some(fn,thisArg);
		}
		var booleanResult=false;
		S.each(collection,function(value,index,obj){
			if(fn.call(thisArg,value,index,obj)){
				booleanResult=true;
				S.breakLoop();
			}
		});
		return booleanResult;
	};

// Determine if a given value is included in the collection
	S.contains=function(collection,target){
		if(Array.prototype.indexOf&&collection.indexOf===Array.prototype.indexOf) {
			return collection.indexOf(target) !== -1;
		}
		var booleanResult=false;
		S.each(collection,function(value,index,obj){
			if(booleanResult= value===target){
				S.breakLoop();
			}
		});
		return booleanResult;
	};

// Return the maximum item or (item-based computation)
	S.max=function(collection,fn,thisArg){
		if(!fn && S.isArray(collection)){
			return Math.max.apply(Math,collection);
		}
		var result={computed:-Infinity};
		S.each(collection,function(value,index,obj){
			var computed=fn?fn.call(thisArg,value,index,obj):value;
			computed>result.computed&&(result={computed:computed,value:value});
		});
		return result.value;
};

// Return the minimum item (or item-based computation).
	S.min=function(collection,fn,thisArg){
		if(!fn&&S.isArray(collection)){
			return Math.min.apply(Math,collection);
		}
		var result= {computed : Infinity};
		S.each(collection,function(value,index,obj){
			var computed=fn?fn.call(thisArg,value,index,obj):value;
			computed<result.computed&&(result = {value : value, computed : computed});
		});
		return result.value;
	};

// Sort the collection's values by a criteria produced by a function
 	S.sortBy=function(collection,fn,thisArg){
 		var temp=S.map(collection,function(value,index,obj){
 			return {
 				value:value,
 				criteria:fn.call(thisArg,value,index,obj)
 			};
 		}).sort(function(left,right){
 			var a=left.criteria,b=right.criteria;
 			return a<b?-1:a>b?1:0;
 		});
 		return S.map(temp,function(value,index,obj){
 			return value.criteria;
 		});
 	};

// Convert anything iterable into a array
	S.toArray = function(collection) {
		if (!collection) return [];
		else if (S.isArray(collection)) {
			return collection;
		}
		else if(S.isArguments(collection)){
			return Array.prototype.slice.call(collection);
		}
		return S.values(collection);
	};

// Return the number of values in an collection
	S.size=function(collection){
		return S.toArray(collection).length;
	};

/*****************Array functions********************/
// Return a completely flattened version of an array
	S.flatten=function(array){
		return S.reduce(array,[],function(memo,currentValue){
			if(S.isArray(currentValue)){
				return memo.concat(S.flatten(currentValue));
			}
			memo.push(currentValue);
			return memo;
		});
	};

// Return a version of the array that does not contain the specified value(s).
	S.without=function(array){
		var removed=Array.prototype.slice.call(arguments,1);
		return S.filter(array,function(value){
			return !S.contains(removed,value);
		});
	};

// Produce a duplicate-free version of the array. If the array has already
// been sorted, you have the option of using a faster algorithm
	S.unique=function(array,isSorted){
		return S.reduce(array,[],function(memo,currentValue,index){
			if(index===0||(isSorted===true?memo[memo.length-1]!==currentValue:!S.contains(memo,currentValue))) {
				memo.push(currentValue);
			}
			return memo;
		});
	};

// Produce an array that contains every item shared between all the
// passed-in arrays.
	S.intersect=function(array){
		var rest=S.toArray(arguments).slice(1);
		var result=new Array();
		S.each(S.unique(array),function(value,index){
			S.every(rest,function(v){
				return S.indexOf(v,value)>-1;
			}) && result.push(value);
		});
		return result;
	};

//_.zip(['moe', 'larry', 'curly'], [30, 40, 50], [true, false, false]);
//=> [["moe", 30, true], ["larry", 40, false], ["curly", 50, false]]
	S.zip=function(){
		var args=S.toArray(arguments);
		var length=S.max(S.pluck(args,"length"));
		var	result=new Array(length);
		for(var i=0;i<length;i++){
			result[i]=S.pluck(args,String(i));
		}
		return result;
	};

//IE8 and previous versions don't support Array.prototype.indexOf
	S.indexOf=function(array,value){
		if(Array.prototype.indexOf&&array.indexOf===Array.prototype.indexOf){
			return array.indexOf(value);
		}
		for(var i=0,len=array.length;i<len;i++){
			if(array[i]===value) return i;
		}
		return -1;
	};

	S.lastIndexOf=function(array,value){
		if(Array.prototype.lastIndexOf&&array.lastIndexOf===Array.prototype.lastIndexOf){
			return array.lastIndexOf(value);
		}
		var index=array.length;
		while(index--){
			if(array[index]===value) return index;
		}
		return -1;
	};
/*****************Object functions*******************/
	S.keys=Object.keys||function(obj){
		var result=new Array();
		if(S.isArray(obj)){
			var i,len=obj.length;
			for(i=0;i<len;i++){
				result.push(i);
			}
			return result;
		}
		for(var key in obj){
			if(Object.prototype.hasOwnProperty.call(obj,key)){
					result.push(key);
			}
		}
		return result;
	};

	S.values=function(obj){
		return S.map(obj,function(value){
			return value;
		});
	};
	
// Return a sorted list of the function names available in obj
	S.allFunctions=function(obj){
		return  S.filter(S.keys(obj),function(value){
					return S.isFunction(obj[value]);
			}).sort();
	};
	
// Create a (shallow-cloned) duplicate of an object
	S.clone=function(obj){
		if(S.isArray(obj)) return obj.slice(0);
		return S.extend({},obj);
	};
	
// Extend a given object with all of the properties in a source object.
	S.extend=function(target,source){
		for(var key in source){
			target[key]=source[key];
		}
		return target;
	};
// Perform a deep comparison to check if two objects are equal,
//using recursive function
	S.isEqual=function(a,b){
		if(a===b) return true;
		var aType=typeof a,
			bType=typeof b;
		if(aType !==bType) return false;
		// Compate Date object
		if(S.isDate(a)&&S.isDate(b)) return a.getTime()===b.getTime();
		// Compare regular expressions.
		if(S.isRegExp(a)&&S.isRegExp(b)){
			return  a.source===b.source &&
				a.global===b.global &&
				a.ignoreCase===b.ignoreCase &&
				a.multiline===b.multiline;
		}
		if(aType !=="object") return false;
		var aKeys=S.keys(a),bKeys=S.keys(b);
		if(aKeys.length!==bKeys.length) return false;
		for(var key in a){
			if(!S.isEqual(a[key],b[key]))  return false;
		}
		return true;
	};

	S.isElement=function(obj){
		return !!(obj&&obj.nodeType===1);
	};
	
	S.isNull=function(obj){
		//attention:the result of typeof null is object
		return obj===null;
	};

	S.isUndefined=function(obj){
		return typeof obj==="undefined";
	};

	S.isNaN=function(obj){
		return S.isNumber(obj)&&isNaN(obj);
	};
	
// Object.prototype.propertyIsEnumerable can determine whether the specified property in an object can be enumerated 
//by a for...in loop, except the properties inherited through the prototype chain.
//S.isArguments is used to determine whether the parameter is an arguments object
	S.isArguments=function(obj){
		return obj&&S.isNumber(obj.length)&&!S.isArray(obj) &&!S.isString(obj)&&!S.isFunction(obj)&&!Object.prototype.propertyIsEnumerable.call(obj,"length");
	};
	
// Define the isArray, isDate, isFunction, isNumber, isRegExp, and isString functions
	S.each(['String','Number','Array','Function','Date','RegExp'],function(type){
		S['is'+type]=function(obj){
			return Object.prototype.toString.call(obj)==="[object " + type + "]";
		};
	});
/******************Function functions*****************/
	S.bind = function(fn, thisArg) {
		var args = S.toArray(arguments).slice(2);
		if (Function.prototype.bind&&fn.bind===Function.prototype.bind) {
			return fn.bind([thisArg].concat(args));
		}
		return function() {
			var finalArgs = args.concat(S.toArray(arguments));
			return fn.apply(thisArg, finalArgs);
		};
	};

//defers a function until all other tasks completed
	S.defer=function(fn){
		var args=S.toArray(arguments).slice(1);
		return setTimeout(function(){
			return fn.apply(null,args);
		},0);
	};

/********************Utility functions******************/
	S.breakLoop=function(){
		throw "break";
	};

	S.noConflict=function(){
		globalObj.S=originalS;
		return this;
	};

/******************Support OOP style invocation******************/
//add all of the sommi.js functions to the instance of Sommi
	S.each(S.allFunctions(S),function(name){
		Sommi.prototype[name]=function(){
			Array.prototype.unshift.call(arguments,this.primitiveObj);
			var result=S[name].apply(S,arguments);
			return this.chainable? S(result).chain():result;
		};

//make the return result chainable	
		Sommi.prototype.chain=function(){
			this.chainable=true;
			return this;
		};

//get the result from the chained instance
		Sommi.prototype.value=function(){
			return this.primitiveObj;
		};
	});



}.call(this);
