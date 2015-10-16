import CriteriaBuilder from "./CriteriaBuilder";

export var COMPARISON_SYMBOLS = ["= ","<> ","> ","< ",">= ","<= "];

class WhereBuilder<T>{
	
	constructor(public parentCriteriaBuilder:CriteriaBuilder<T>,public key:string){
		
	}
	
	/**
	 * Equals
	 */
	eq(val:any):CriteriaBuilder<T>{
		this.parentCriteriaBuilder.rawCriteria[this.key] = "= "+val;
		return this.parentCriteriaBuilder;
	}
	
	/**
	 * Is Not Equal to
	 */
	ne(val:any):CriteriaBuilder<T>{
		this.parentCriteriaBuilder.rawCriteria[this.key] = "<> "+val;
		return this.parentCriteriaBuilder;
	}
	
	/**
	 * Greater Than
	 */
	gt(val:any):CriteriaBuilder<T>{
		this.parentCriteriaBuilder.rawCriteria[this.key] = "> "+val;
		return this.parentCriteriaBuilder;
	}
	
	/**
	 * Less Than
	 */
	lt(val:any):CriteriaBuilder<T>{
		this.parentCriteriaBuilder.rawCriteria[this.key] = "< "+val;
		return this.parentCriteriaBuilder;
	}
	
	/**
	 * Is greater than or equal to
	 */
	ge(val:any):CriteriaBuilder<T>{
		this.parentCriteriaBuilder.rawCriteria[this.key] = ">= "+val;
		return this.parentCriteriaBuilder;
	}
	
	/**
	 * Is less than or equal to
	 */
	le(val:any):CriteriaBuilder<T>{
		this.parentCriteriaBuilder.rawCriteria[this.key] = "<= "+val;
		return this.parentCriteriaBuilder;
	}
	
		
}

export default WhereBuilder;