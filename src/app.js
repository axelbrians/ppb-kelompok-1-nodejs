import express from "express";
import morgan from "morgan";
import fs from "fs";
import crypto from "crypto";
import PG from "pg";
import { uniqueNamesGenerator, names } from "unique-names-generator";


import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const pool = new PG.Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'ppb-kelompok-1',
	password: '13',
	port: 5432,
});

const namesGeneratorConfig = {
  dictionaries: [names, names]
}



app.use(morgan('common'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: false }));
app.use(express.static('public'));


app.get('/', (req, res) => {

	res.send("Hello world");
});

app.post('/tweet/post', (req, res) => {

	let base64Data = req.body.image;

	let baseDir = path.join(__dirname, '/.assets/');
	console.log(baseDir);

	if (!base64Data) {
		res.status(500).json({
			code: 500,
			message: "image cannot be null"
		});
	} else {
		base64Data = base64Data.replace(/^data:image\/jpg;base64,/, "");
		const seed = crypto.randomBytes(20);
		const uniqueSHA1String = crypto.createHash('sha1').update(seed).digest('hex');
		const storeLocation = __dirname + '/../public/uploads/';
		const imageName = 'image-' + uniqueSHA1String;
		const imagePath = storeLocation + imageName + '.jpg';
		const pathToStore = 'uploads/' + imageName + '.jpg';

		// console.log(`base64: ${base64Data}`);
		console.log(`imagePath ${imagePath}`);
		console.log(`pathToStore ${pathToStore}`);
		// pool.query('SELECT NOW()', (err, res) => {
		// 	console.log(err, res)
		// 	pool.end()
		// });


		// pool.query('SELECT * FROM post', (err, res) => {
		//     console.log(err, res)
		//     pool.end()
		// });

		try {
			fs.writeFile(imagePath, base64Data, 'base64', (err) => {
				if (err) {
					res.status(500).json({
						code: 500,
						message: "invalid file type, must be .jpg files"
					});
				} else {
					const query = 'INSERT INTO post(path) VALUES($1) RETURNING *';
					const values = [ pathToStore ];

					pool.query(query, values)
					.then(pgRes => {
						console.log('user:', pgRes.rows[0]);
						res.status(200).json({
							code: 200,
							message: "success"
						});
					})
					.catch(pgError => {
						console.log(pgError);
						res.status(500).json({
							code: 500,
							message: "something went wrong"
						})
					});


				}
			});
		} catch (err) {
			res.status(500).json({
				code: 500,
				message: "invalid file type, must be .jpg files"
			});
		}

		// res.status(200).json({
		// 	code: 200,
		// 	message: "success"
		// });
	}
});

app.get('/tweet/all', (req, res) => {
	const query = "SELECT * FROM post ORDER BY id DESC";

	pool.query(query)
		.then(pgRes => {
			console.log(pgRes);

			const data = pgRes.rows.map((data, index) => {
				return {
					id: data.id,
					name: uniqueNamesGenerator(namesGeneratorConfig).replace("_", " "),
					path: "10.0.2.2:3000/" + data.path
				}
			});
			console.log(data);
			res.status(200).json({
				code: 200,
				message: "success",
				data
			});
		})
		.catch(pgError => {
			console.log(pgError);
			res.status(500).json({
				code: 500,
				message: "something went wrong"
			})
		});
});

app.listen(3000, () => {
	console.log(`PPB app listening at http://localhost:${3000}`)
});