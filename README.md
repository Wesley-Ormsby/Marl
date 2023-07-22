# Marl

Marl is a statement-based stack-oriented single-thread procedural language, combining the power of stacks with intuitive statments for a unique coding experience.

Marl was born out of my desire to learn programming language implementation and create an easy-to-work-with language that breaks free from traditional paradigms. As a side project, I disliked Lisp-like syntax and didn't know how to create a Pratt parser. This led to Marl's unique dual nature, which combines the expressive nature of stacks with the familiarity of statements for control flow, variables, and functions.

In Marl, stacks play a central role, enabling you to work with expressions. However, unlike traditional stack-oriented languages, Marl takes a different approach. It introduces a stack type, allowing you to harness the power of stacks while offering a more intuitive and flexible programming experience within statments.

# Example
### FizzBuzz
```python
for i from 1 to 100 {
    case {
        when [i 15 % 0 ==] {
            print("FizzBuzz")
        }
        when [i 3 % 0 ==] {
            print("Fizz")
        }
        when [i 5 % 0 ==] {
            print("Buzz")
        }
        default {
            print(i)
        }
    }
}
```
Further examples are present in the [examples](/examples/) folder



## CLI Instalation
```bash
npm install marl -g
```

## Running Files Via CLI
```bash
marl myFile.marl
```