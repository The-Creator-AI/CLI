## LLM Code Assistant

This is a simple script that uses a large language model (LLM) to help you make code changes to your project.
The script takes a code diff as input and uses the LLM to help you apply the diff, suggest improvements, or generate commit messages.

## To use:
1. Install the Script Globally:  
```sudo ./install.sh```

2. Run the Script from Any Directory:  
```llm```

***Voila! The prompt with all the code from the repo is copied to your clipboard.***

## The script uses four configuration files:
 
> **<span style="color:blue">system-instruction.llm:</span>**  
This file contains instructions for the LLM. You can specify things like the desired tone of the response, the type of output (e.g., code, prose), and any specific constraints or goals. The content of this file will be appended to the beginning of the output file.  

> **<span style="color:green">prompt.llm:</span>**   
This file contains the prompt you want to give to the LLM. The content of this file will be appended to the end of the output file.  

> **<span style="color:orange">ignore.llm:</span>**  
This file contains a list of patterns that you want to ignore, it works just like a .gitignore file. The content of this file will be used to filter out the code from the repo.

> **<span style="color:purple">content.llm:</span>**  
This file contains the final output of the LLM. This file is automatically created by the script.  
The content of this file is also copied to your clipboard.  