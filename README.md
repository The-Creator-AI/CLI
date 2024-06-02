## LLM Code Assistant

This is a simple script that uses a large language model (LLM) to help you make code changes to your project.
The script takes a code diff as input and uses the LLM to help you apply the diff, suggest improvements, or generate commit messages.

## To use:
1. Install the Script Globally:  
```sudo ./install.sh```

2. Run the Script from Any Directory:  
```llm```

***Voila! The prompt with all the code from the repo is copied to your clipboard.***

## The script uses these configuration files:
> **<span style="color:orange">ignore.llm:</span>**  
This file contains a list of patterns that you want to ignore, it works just like a .gitignore file. The content of this file will be used to filter out the code from the repo.