// Preseason 2026 season projections. One player per line:
// Name|Position|Team|PPR points|Receptions
// Half PPR and Standard scoring are worked out from the receptions.
// Edit this list to update teams or projections; rankings, tiers, trade
// values and draft order are all recalculated from it.

const RAW = [
  // Quarterbacks
  'Josh Allen|QB|BUF|392', 'Lamar Jackson|QB|BAL|374', 'Jayden Daniels|QB|WAS|356',
  'Jalen Hurts|QB|PHI|352', 'Joe Burrow|QB|CIN|346', 'Drake Maye|QB|NE|334',
  'Baker Mayfield|QB|TB|318', 'Bo Nix|QB|DEN|316', 'Patrick Mahomes|QB|KC|300',
  'Dak Prescott|QB|DAL|306', 'Caleb Williams|QB|CHI|302', 'Justin Herbert|QB|LAC|300',
  'Jared Goff|QB|DET|298', 'Jaxson Dart|QB|NYG|292', 'Brock Purdy|QB|SF|290',
  'Matthew Stafford|QB|LAR|288', 'Trevor Lawrence|QB|JAX|288', 'Jordan Love|QB|GB|284',
  'C.J. Stroud|QB|HOU|270', 'Sam Darnold|QB|SEA|268', 'J.J. McCarthy|QB|MIN|258',
  'Michael Penix Jr.|QB|ATL|250', 'Bryce Young|QB|CAR|248', 'Cam Ward|QB|TEN|252',
  'Tyler Shough|QB|NO|240', 'Fernando Mendoza|QB|LV|232', 'Shedeur Sanders|QB|CLE|220',
  'Malik Willis|QB|MIA|236',

  // Running backs
  'Bijan Robinson|RB|ATL|332|70', 'Jahmyr Gibbs|RB|DET|322|64', 'Christian McCaffrey|RB|SF|288|70',
  "De'Von Achane|RB|MIA|286|70", 'Jonathan Taylor|RB|IND|282|36', 'Saquon Barkley|RB|PHI|270|40',
  'Ashton Jeanty|RB|LV|268|46', 'James Cook|RB|BUF|252|34', 'Derrick Henry|RB|BAL|248|18',
  'Bucky Irving|RB|TB|244|52', 'Chase Brown|RB|CIN|246|52', 'Kyren Williams|RB|LAR|240|34',
  'Josh Jacobs|RB|GB|244|34', 'Omarion Hampton|RB|LAC|232|40', 'Breece Hall|RB|NYJ|222|46',
  'TreVeyon Henderson|RB|NE|222|40', 'Cam Skattebo|RB|NYG|210|36', 'Javonte Williams|RB|DAL|208|34',
  'Quinshon Judkins|RB|CLE|206|24', 'RJ Harvey|RB|DEN|202|40', "D'Andre Swift|RB|CHI|190|40",
  'Woody Marks|RB|HOU|172|36', 'Jacory Croskey-Merritt|RB|WAS|170|16', 'Chuba Hubbard|RB|CAR|178|34',
  'Zach Charbonnet|RB|SEA|172|26', 'Bhayshul Tuten|RB|JAX|170|26', 'Tony Pollard|RB|TEN|178|30',
  'Jaylen Warren|RB|PIT|176|40', 'Jordan Mason|RB|MIN|160|16', 'James Conner|RB|ARI|158|34',
  'Rhamondre Stevenson|RB|NE|140|30', 'Tyrone Tracy Jr.|RB|NYG|138|30', 'Trey Benson|RB|ARI|140|20',
  'Kaleb Johnson|RB|PIT|138|16', 'Tyjae Spears|RB|TEN|130|36', 'Kyle Monangai|RB|CHI|122|14',
  'Dylan Sampson|RB|CLE|112|30', 'Kimani Vidal|RB|LAC|110|20', 'Jaydon Blue|RB|DAL|102|26',
  'Jonathon Brooks|RB|CAR|108|20', 'Blake Corum|RB|LAR|108|10', 'Braelon Allen|RB|NYJ|110|16',
  'Keaton Mitchell|RB|BAL|108|16', 'Tank Bigsby|RB|PHI|104|10', 'Jaylen Wright|RB|MIA|98|14',
  'Ray Davis|RB|BUF|92|12', 'Ollie Gordon II|RB|MIA|96|10', 'Justice Hill|RB|BAL|90|30',
  'Sean Tucker|RB|TB|88|14', 'Isaac Guerendo|RB|SF|82|10', 'Chris Rodriguez Jr.|RB|WAS|80|6',
  'MarShawn Lloyd|RB|GB|80|10', 'Will Shipley|RB|PHI|70|16',

  // Wide receivers
  "Ja'Marr Chase|WR|CIN|330|110", 'Puka Nacua|WR|LAR|322|116', 'Jaxon Smith-Njigba|WR|SEA|304|106',
  'Amon-Ra St. Brown|WR|DET|300|110', 'CeeDee Lamb|WR|DAL|292|100', 'Justin Jefferson|WR|MIN|290|100',
  'Malik Nabers|WR|NYG|288|104', 'Drake London|WR|ATL|272|96', 'Rashee Rice|WR|KC|250|92',
  'Nico Collins|WR|HOU|262|84', 'Brian Thomas Jr.|WR|JAX|242|80', 'Garrett Wilson|WR|NYJ|242|90',
  'Ladd McConkey|WR|LAC|238|90', 'Tetairoa McMillan|WR|CAR|240|86', 'Chris Olave|WR|NO|234|92',
  'A.J. Brown|WR|PHI|240|80', 'George Pickens|WR|DAL|236|80', 'Tee Higgins|WR|CIN|230|74',
  'Emeka Egbuka|WR|TB|228|80', 'Zay Flowers|WR|BAL|226|80', 'Davante Adams|WR|LAR|230|74',
  'Courtland Sutton|WR|DEN|216|74', 'Terry McLaurin|WR|WAS|212|74', 'DK Metcalf|WR|PIT|210|70',
  'Marvin Harrison Jr.|WR|ARI|216|70', 'Jameson Williams|WR|DET|210|60', 'DeVonta Smith|WR|PHI|210|74',
  'Rome Odunze|WR|CHI|206|70', 'Luther Burden III|WR|CHI|194|72', 'Xavier Worthy|WR|KC|190|64',
  'Jordan Addison|WR|MIN|192|64', 'Khalil Shakir|WR|BUF|190|80', 'Josh Downs|WR|IND|182|76',
  'Ricky Pearsall|WR|SF|186|66', 'Jakobi Meyers|WR|JAX|180|70', 'Travis Hunter|WR|JAX|178|60',
  'Jayden Reed|WR|GB|176|60', 'Alec Pierce|WR|IND|172|50', 'Matthew Golden|WR|GB|164|56',
  'Christian Watson|WR|GB|168|50', 'Quentin Johnston|WR|LAC|174|56', 'Troy Franklin|WR|DEN|160|60',
  'Chris Godwin Jr.|WR|TB|170|66', 'Jerry Jeudy|WR|CLE|160|60', 'Keon Coleman|WR|BUF|150|50',
  'Jayden Higgins|WR|HOU|152|56', 'Tre Harris|WR|LAC|140|50', 'Jalen McMillan|WR|TB|140|50',
  'Elic Ayomanor|WR|TEN|132|50', 'Michael Wilson|WR|ARI|130|50', 'Cedric Tillman|WR|CLE|138|50',
  'Jalen Coker|WR|CAR|122|46', 'Kayshon Boutte|WR|NE|112|40', 'Malik Washington|WR|MIA|112|50',
  'Tre Tucker|WR|LV|120|46', 'Kyle Williams|WR|NE|128|44', 'Tank Dell|WR|HOU|110|40',
  'Jack Bech|WR|LV|110|40', 'Marvin Mims Jr.|WR|DEN|110|40', 'Rashod Bateman|WR|BAL|100|40',
  'Demario Douglas|WR|NE|100|46', 'Xavier Legette|WR|CAR|100|40', 'Adonai Mitchell|WR|NYJ|100|36',
  'Darius Slayton|WR|NYG|98|36', 'Joshua Palmer|WR|BUF|90|36', 'Dontayvion Wicks|WR|GB|90|30',
  'KaVontae Turpin|WR|DAL|90|30', 'Pat Bryant|WR|DEN|88|34', 'Tyquan Thornton|WR|KC|88|30',
  'Jaylin Lane|WR|WAS|80|30', 'Isaiah Bond|WR|CLE|80|30',

  // Tight ends
  'Trey McBride|TE|ARI|262|110', 'Brock Bowers|TE|LV|256|104', 'Tyler Warren|TE|IND|204|76',
  'George Kittle|TE|SF|198|70', 'Sam LaPorta|TE|DET|182|66', 'Colston Loveland|TE|CHI|182|70',
  'Tucker Kraft|TE|GB|180|60', 'Jake Ferguson|TE|DAL|176|76', 'Harold Fannin Jr.|TE|CLE|162|66',
  'Dalton Kincaid|TE|BUF|160|60', 'Mark Andrews|TE|BAL|158|50', 'Kyle Pitts|TE|ATL|160|66',
  'T.J. Hockenson|TE|MIN|150|60', 'Oronde Gadsden II|TE|LAC|150|56', 'Hunter Henry|TE|NE|150|60',
  'Dallas Goedert|TE|PHI|150|58', 'Evan Engram|TE|DEN|140|60', 'Juwan Johnson|TE|NO|140|60',
  'Brenton Strange|TE|JAX|130|56', 'Mason Taylor|TE|NYJ|130|56', 'Theo Johnson|TE|NYG|120|46',
  'Dalton Schultz|TE|HOU|112|50', 'Cade Otton|TE|TB|110|46', 'AJ Barner|TE|SEA|110|46',
  'Pat Freiermuth|TE|PIT|100|40', 'Terrance Ferguson|TE|LAR|90|36', 'Elijah Arroyo|TE|SEA|80|30',

  // Kickers
  'Brandon Aubrey|K|DAL|160', 'Cameron Dicker|K|LAC|152', 'Jake Bates|K|DET|146',
  "Ka'imi Fairbairn|K|HOU|146", 'Chase McLaughlin|K|TB|144', 'Wil Lutz|K|DEN|142',
  'Chris Boswell|K|PIT|140', 'Jason Myers|K|SEA|140', 'Tyler Bass|K|BUF|136',
  'Evan McPherson|K|CIN|136', 'Harrison Butker|K|KC|134', 'Tyler Loop|K|BAL|132',
  'Jake Elliott|K|PHI|130', 'Eddy Pineiro|K|SF|130', 'Cairo Santos|K|CHI|128',
  'Brandon McManus|K|GB|128', 'Spencer Shrader|K|IND|124', 'Jason Sanders|K|MIA|124',
  'Chad Ryland|K|ARI|120',

  // Defense / special teams
  'Broncos D/ST|DST|DEN|150', 'Texans D/ST|DST|HOU|146', 'Seahawks D/ST|DST|SEA|144',
  'Eagles D/ST|DST|PHI|136', 'Rams D/ST|DST|LAR|134', 'Steelers D/ST|DST|PIT|132',
  'Vikings D/ST|DST|MIN|130', 'Bills D/ST|DST|BUF|130', 'Ravens D/ST|DST|BAL|130',
  'Packers D/ST|DST|GB|128', 'Lions D/ST|DST|DET|126', 'Patriots D/ST|DST|NE|126',
  'Chiefs D/ST|DST|KC|124', 'Jaguars D/ST|DST|JAX|124', 'Chargers D/ST|DST|LAC|122',
  'Bears D/ST|DST|CHI|120', '49ers D/ST|DST|SF|120', 'Browns D/ST|DST|CLE|118',
  'Buccaneers D/ST|DST|TB|114', 'Colts D/ST|DST|IND|112'
];
