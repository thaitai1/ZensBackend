const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;

// Connect to the MongoDB database
mongoose.connect('mongodb+srv://bothofuscando:Thaitai12@chatting.fyraubl.mongodb.net/', {

    useNewUrlParser: true,
    useUnifiedTopology: true,
}
);

// Define the Joke schema and model
const jokeSchema = new mongoose.Schema({
    jokeText: String,
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
});
const Joke = mongoose.model('Joke', jokeSchema);

// Middleware to parse cookies
app.use(cookieParser());

// Define a route for getting a random joke
app.get('/joke', async (req, res) => {
    try {
        // Get the user's vote cookie
        const userVote = req.cookies.vote;

        // Get a random joke from the database that the user hasn't voted for
        const joke = await Joke.findOne({ _id: { $nin: userVote } }).skip(
            Math.floor(Math.random() * (await Joke.countDocuments()))
        );

        if (!joke) {
            // If there are no jokes in the database or the user has voted for all jokes
            res.send("That's all the jokes for today! Come back another day!");
        } else {
            res.send(joke.jokeText);
        }
    } catch (error) {
        res.status(500).send('An error occurred while fetching the joke.');
    }
});

// Define a route for recording a vote for a joke
app.post('/joke/:jokeId/:vote', async (req, res) => {
    try {
        const { jokeId, vote } = req.params;

        // Update the vote count for the joke in the database
        const joke = await Joke.findById(jokeId);
        if (!joke) {
            return res.status(404).send('Joke not found.');
        }

        if (vote === 'like') {
            joke.likes++;
        } else if (vote === 'dislike') {
            joke.dislikes++;
        } else {
            return res.status(400).send('Invalid vote.');
        }

        await joke.save();

        // Set the vote cookie for the user
        res.cookie('vote', jokeId, { maxAge: 86400000 }); // Cookie expires in 24 hours

        res.send('Vote recorded successfully.');
    } catch (error) {
        res.status(500).send('An error occurred while recording the vote.');
    }
});

// Initialize the database with jokes
async function initializeDatabase() {
    try {
        await Joke.deleteMany({}); // Clear existing jokes

        const jokes = [
            {
                jokeText:
                    "A child asked his father, 'How were people born?' So his father said, 'Adam and Eve made babies, then their babies became adults and made babies, and so on.' The child then went to his mother, asked her the same question and she told him, 'We were monkeys then we evolved to become like we are now.' The child ran back to his father and said, 'You lied to me!' His father replied, 'No, your mom was talking about her side of the family.'",
            },
            {
                jokeText:
                    "Teacher: 'Kids, what does the chicken give you?' Student: 'Meat!' Teacher: 'Very good! Now what does the pig give you?' Student: 'Bacon!' Teacher: 'Great! And what does the fat cow give you?' Student: 'Homework!'",
            },
            {
                jokeText:
                    "The teacher asked Jimmy, 'Why is your cat at school today Jimmy?' Jimmy replied crying, 'Because I heard my daddy tell my mommy, 'I am going to eat that pussy once Jimmy leaves for school today!''",
            },
            {
                jokeText:
                    "A housewife, an accountant and a lawyer were asked 'How much is 2+2?' The housewife replies: 'Four!'. The accountant says: 'It's either 3 or 4. Let me run those figures through my spreadsheet one more time.' The lawyer pulls the drapes, dims the lights and asks in a hushed voice, 'How much do you want it to be?'",
            },
        ];

        await Joke.insertMany(jokes);
        console.log('Database initialized with jokes.');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Initialize the database on server start
initializeDatabase();

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
