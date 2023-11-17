const {Request, Response} = require("express");

/**
 * @param req {Request}
 * @param res {Response}
 * @param next {CallableFunction}
 */
const default_next = (req, res, next) => { return next(req, res); };

/**
 * Return combined endpoint functions
 *
 * @param general_func {CallableFunction} General function ( = endpoint.func )
 * @param base_func {CallableFunction} General function ( = endpoint.types.[get/post] )
 */
exports.build_endpoint_func = (general_func, base_func) => {
    return (req, res) => {
        return base_func(req, res, general_func);
    };
};
exports.endpoints = {};

exports.endpoints.generate = {
    path: "/generate",
    types: {"get": default_next, "post": default_next},
    /**
     * @param req {Request}
     * @param res {Response}
     */
    func: (req, res) => {
        res.json({error: "Not available"});
    }
};