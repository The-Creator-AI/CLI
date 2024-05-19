## Intro
This script creates a single prompt with all the code from the repo.

## To use:
1. Install the Script Globally:  
```sudo ./install.sh```

2. Run the Script from Any Directory:  
```llm```

## The script uses three configuration files:
 
**system-instruction.llm:**  
This file contains instructions for the LLM. You can specify things like the desired tone of the response, the type of output (e.g., code, prose), and any specific constraints or goals. The content of this file will be appended to the beginning of the output file.  

 **prompt.llm:**   
This file contains the prompt you want to give to the LLM. The content of this file will be appended to the end of the output file.  

**content.llm:**  
This file contains the final output of the LLM. This file is automatically created by the script.  