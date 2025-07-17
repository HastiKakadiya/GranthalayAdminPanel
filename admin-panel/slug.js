let slug = "hello-ok-pl1"
let check = slug.match(/^[a-z0-9][a-z0-9\-]*[a-z0-9]$/)
if(check){
    // return true;
    console.log("true")
}else{
    console.log("false")
    // return false;
}