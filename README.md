## Inspiration
Most students always have to choose between listening to my teacher and writing everything down. Whenever they are focused on taking notes, they missed important explanations. But if they paid attention, the students will still ended up with incomplete notes. It felt like students had to sacrifice one for the other.
That's why we built OmniScribe. We wanted an AI that takes care of the note-taking so students can spend class actually learning instead of trying to write every word.

## What it does
OmniScribe is an AI powered study assistant that turns lectures into an interactive learning experience instead of just a page of notes.
It can:
- Create interactive knowledge graphs that connect ideas together so you can actually see how concepts relate.
- Teach concepts your way. Whether you understand things better through sports, coding, stories, or simple examples, the AI adapts its explanations to match your learning style.
- Catch confusing topics early by finding concepts students commonly mix up before they become problems on tests.
- Build personalized study plans based on your exam date so you know exactly what to study each day.
- Generate practice quizzes with explanations so you're learning from your mistakes instead of just seeing whether you were right or wrong.

Instead of only giving students notes, OmniScribe helps them actually understand what they're learning.

## How we built it
- We built the frontend using React, Vite, and Tailwind CSS to create a fast and responsive interface.
- For the backend, we used Node.js with Supabase to handle authentication, user accounts, and our PostgreSQL database.
- Our AI features are powered by Grok, which extracts important concepts, builds knowledge graphs, generates quizzes, creates study plans, and acts as a personalized tutor.
- The app is deployed on Vercel, and users can either sign in with Google or instantly try everything using a guest account.

## Challenges we ran into
- One of the biggest challenges was getting authentication working correctly. Configuring Google OAuth with Supabase and Vercel took much longer than expected because of redirect URLs and production settings.
- Another challenge was processing lecture transcripts. Early on, the AI sometimes misunderstood timestamps and even turned a short lecture into one that was much longer than it actually was. We had to improve our prompts and processing logic so the AI respected the real transcript timing.
- We also had to fix deployment issues with React routing on Vercel, where refreshing certain pages caused 404 errors until we configured proper rewrite rules.

## Accomplishments that we're proud of
- One thing we're most proud of is that the AI isn't just summarizing lectures, it actually helps students learn. It builds knowledge graphs, creates personalized study plans, explains difficult topics in different ways, and generates practice quizzes automatically.
- We're also proud of making the app easy to try. People can jump straight into a guest account without creating an account first, making the experience much smoother.
- Finally, seeing a lecture transformed into an interactive map of connected ideas was one of the coolest parts of the project.

## What we learned
- This project taught us a lot about prompt engineering and how important it is to structure AI responses consistently, especially when working with long transcripts.
- We also learned how production authentication works across Google OAuth, Supabase, and Vercel, and gained experience deploying a full stack React application with secure environment variables and proper routing.

## What's next for OmniScribe
We have a lot of ideas we'd love to add in the future:
- Record lectures live and generate knowledge graphs in real time.
- Let students upload lecture slides or PDFs so the AI can combine them with lecture audio.
- Export flashcards directly into apps like Anki or Notion.
- Add collaborative study groups where classmates can share knowledge graphs and compete in AI generated quiz battles.

Our goal is simple: make learning more interactive, more personalized, and a lot less stressful so students can spend their time understanding instead of just copying notes.
