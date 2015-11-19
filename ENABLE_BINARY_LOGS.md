```
IF MYSQL SERVER VERSION IS GREATER OR EQUAL THAN 5.7 follow this:

  IF OS === Windows 
	IF (MYSQL INSIDE xampp,wamp) 
	    1. Open: C:/ xampp/ OR wamp/ mysql/YOUR_MYSQL_VERSION/my.ini 
	ELSE  
		1. Open explorer and write : %PROGRAMDATA%/MySQL/MySQL Server 5.7/my.ini
		
    2. Go to the lines(119-120) which you can see these contents: 
	  # Binary Logging.
	  # log-bin
    3. Just uncomment the # log-bin, finall result must look like that:
	  # Binary Logging.
	  log-bin
	  								
    4. Restart the mysql server service and you are ready.
```   
``` 
 ELSE IF OS === (L)Unix
	IF (MYSQL INSIDE lampp) 
	    1. Open explorer and open opt/lampp/etc/my.cnf
	ELSE  
		1. Find where is my.cnf using these one of these shell commands: 
			locate my.cnf
			whereis my.cnf
			find . -name my.cnf
			
		   and open the my.cnf file.
		
   2. Go to the line(119-120) which you can see these contents: 
	  # Binary Logging.
	  # log-bin
   3. Just uncomment the # log-bin, finall result must look like that:
	  # Binary Logging.
	  log-bin
	  								
   4. Restart the mysql server service and you are ready. 
```  
```
ELSE IF MYSQL SERVER VERSION IS LESS OR EQUAL THAN 5.6
    Watch on youtube this video: https://www.youtube.com/watch?v=xrTBFZyn-Bk
```