const wrapAsync = (fn) => {
    return (req, res, next) => {
        // This is the key. Promise.resolve ensures that whatever fn returns (or throws)
        // is always treated as a Promise.
        // If fn returns a Promise, Promise.resolve just passes it through.
        // If fn throws a synchronous error, Promise.resolve makes it a rejected Promise.
        // If fn returns a non-Promise value, Promise.resolve makes it a resolved Promise.
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};





// const wrapAsync = function (fn) {
//     return function (req, res, next) {
//         fn(req, res, next)
//             .then((res) => {})
//             .catch((err) => {
//                 next(err);
//             });
//     };
// }

// or

//it is also a option
// const wrapAsync = (fn) => (req, res, next) => 
// fn(req, res, next).
// catch(next);

module.exports = wrapAsync;