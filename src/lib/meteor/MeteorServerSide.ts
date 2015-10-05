/**
 * This file is used by package.js for meteor js publish package only.
 */

declare var Mysql: any;

declare module Npm {
	function require(mod: string);
}

Mysql = {};

Mysql = Npm.require("node-mysql-wrapper");



	
