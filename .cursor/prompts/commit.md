# Generate Commit Message

Analyze my staged git changes and generate a commit message:

1. Check `git status`, `git diff --staged`, and recent commit history
2. Draft a clear, concise commit message that:
   - Starts with a verb (Add, Update, Fix, etc.)
   - Explains the "why" not just the "what"
   - Mentions platform-specific changes for Expo/React Native (iOS, Android, web)
3. Show me the proposed commit message
4. Ask "Would you like me to commit these changes with this message?"
5. Wait for my confirmation before committing
6. Only commit if I explicitly say yes
7. After successful commit, ask "Would you like to push these changes to the remote branch?"
8. If confirmed, run `git push` (or `git push -u origin <branch-name>` if it's a new branch)
9. Show the push result
