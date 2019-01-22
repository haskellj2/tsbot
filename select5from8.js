fn = function(s, e, c, l) {
    s2 = s;
    e2 = e;
    c2 = c;
    l2 = l;
    if (e2 - s2 >= c2) {
        //console.log(l);
        fn(s2 + 1, e2, c2, l2);
    }
    if (e - s >= c - 1 && c > 1) {
        l.push(s);
        if (l.length == 5) {
            console.log(l);
        } else {
            //console.log(l);
            fn(s + 1, e, c - 1, l);
        }


    }


};

fn(1, 8, 5, []);