import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
//   if (req.method !== 'POST') {
//     res.status(405).json({ message: 'Method Not Allowed' });
//     return;
//   }
// https://chat-backend-self.vercel.app/home/recording-start
// http://localhost:3001/home/recording-start
const id = req.body.chatId || '';

console.log("chat id : ", id)

  try {
    const response = await fetch('https://solutions.it-marketing.website/recording-start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
        chatId: id,
        apiType: "audio",
      }),
    });

    // const response = await axios.post('https://solutions.it-marketing.website/recording-start', {
    //     chatId: id,
    //     apiType: "audio"
    //   }, {
    //     headers: {
    //       'Content-Type': 'application/json'
    //     }
    //   });

    // if (response.status !== 200) {
    //   const error = await response.json();
    //   throw new Error(error.message);
    // }

    // const data = await response.json();

    if (response.status !== 200) {
      throw new Error(response.data.message);
    }
  
    const data = response.data;
    console.log(data)
    res.status(200).json({ transcript: data.transcript });

  } catch (error) {
    res.status(500).json({ error });
  }

  // try {
  //   res.status(200).json({ transcript: "Welcome speech recognition"});
  // } catch (error) {
  //   res.status(500).json({ error });
  // }
}
