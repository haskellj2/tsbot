const l = 10,
    s = `testing`,
    foo = true;
const arr = [l, s, foo];

const jsonString = JSON.stringify(arr);
const jsonObj = JSON.parse(jsonString);

const [l1, s1, foo1] = arr;
const [l2, , foo2, last2] = arr;
// last2 === undefined

debugger;