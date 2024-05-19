## Intro
This script creates a single prompt with all the code from the repo.

## To use:
1. Install the Script Globally:  
```sudo ./install.sh```

2. Run the Script from Any Directory:  
```llm```

> Voila! The prompt with all the code from the repo is copied to your clipboard.

## The script uses four configuration files:
 
**system-instruction.llm:**  
This file contains instructions for the LLM. You can specify things like the desired tone of the response, the type of output (e.g., code, prose), and any specific constraints or goals. The content of this file will be appended to the beginning of the output file.  

 **prompt.llm:**   
This file contains the prompt you want to give to the LLM. The content of this file will be appended to the end of the output file.  

**ignore.llm:**
This file contains a list of patterns that you want to ignore, it works just like a .gitignore file. The content of this file will be used to filter out the code from the repo.

**content.llm:**  
This file contains the final output of the LLM. This file is automatically created by the script.  
The content of this file is also copied to your clipboard.  