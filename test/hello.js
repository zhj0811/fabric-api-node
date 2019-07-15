var a ={
    def:"b",
    from:"c"
}

var b = {
    from:"d",
    to: "e"
}

b.to = a.to;
if (a.to != ""){
    console.log("true");
}
console.log(b);