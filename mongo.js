const mongodb = require('mongodb');
const uri = "mongodb+srv://152433Aa:152433Aa@tikaltest.fsfmr.mongodb.net/tikaltest?retryWrites=true&w=majority"
let db;


const initConnection = async function() {
await mongodb.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true },
    function (err, client) {
    if(err)
        console.log(err);
    console.log("connected");
    db = client.db();
    });
}
initConnection();
const get = async function () {
    console.log('gonna check if has db')
    if (!db) {
    console.log('no db, lets init connection')

        await initConnection();
    console.log('done init db')

    }
    console.log('lets get collection')
    console.log(db);
    var data = await db.collection('tikaltestdb').find().toArray();
    return data
}

module.exports = {get}
const write = () => {
    db.collection('tikaltestdb').insertMany(
        [{agent: '007', country: 'Brazil',
            address: 'Avenida Vieira Souto 168 Ipanema, Rio de Janeiro',
            date: 'Dec 17, 1995, 9:45:17 PM'
        },
        {agent: '005', country: 'Poland',
            address: 'Rynek Glowny 12, Krakow',
            date: 'Apr 5, 2011, 5:05:12 PM'
        },
        {agent: '007', country: 'Morocco',
            address: '27 Derb Lferrane, Marrakech',
            date: 'Jan 1, 2001, 12:00:00 AM'
        },
        {agent: '005', country: 'Brazil',
            address: 'Rua Roberto Simonsen 122, Sao Paulo',
            date: 'May 5, 1986, 8:40:23 AM'
        },
        {agent: '011', country: 'Poland',
            address: 'swietego Tomasza 35, Krakow',
            date: 'Sep 7, 1997, 7:12:53 PM'
        },
        {agent: '003', country: 'Morocco',
            address: 'Rue Al-Aidi Ali Al-Maaroufi, Casablanca',
            date: 'Aug 29, 2012, 10:17:05 AM'
        },
        {agent: '008', country: 'Brazil',
            address: 'Rua tamoana 418, tefe',
            date: 'Nov 10, 2005, 1:25:13 PM'
        },
        {agent: '013', country: 'Poland',
            address: 'Zlota 9, Lublin',
            date: 'Oct 17, 2002, 10:52:19 AM'
        },
        {agent: '002', country: 'Morocco',
            address: 'Riad Sultan 19, Tangier',
            date: 'Jan 1, 2017, 5:00:00 PM'
        },
        {agent: '009', country: 'Morocco',
            address: 'atlas marina beach, agadir',
            date: 'Dec 1, 2016, 9:21:21 PM'
        }]

, function (
        err,
        info
    ) {
        console.log('written')
    });
};





