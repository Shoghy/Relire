export default function copyProperties(src:any, dest:any, avoid:any=[]){
    for(let key in src){
        if(avoid.indexOf(key) > -1) continue;
        dest[key] = src[key];
    }
}