## Data

#### File: Demographics_RacialEthnic_2019_Schools.csv

Brief: Conversion to CSV of original data file. However, "No" and "Pct"
have been added to column headers.

Loading the data:

```
  // Load the data
  d3.csv('./data/Demographics_RacialEthnic_2019_Schools.csv', function(data) {
    console.log(data);
    console.log(data[618]); // view a particular row    
  });
```

First line of file:
* This line contains summary data for the district as a whole for the given year.

Sample:

```
"Total": " 361,314 "
African AmericanNo: " 132,194 "
African AmericanPct: " 36.6 "
Asian/ Pacific Islander (Retired)No: " 20 "
Asian/ Pacific Islander (Retired)Pct: " 0.0 "
AsianNo: " 14,933 "
AsianPct: " 4.1 "
Hawaiian/Pacific IslanderNo: " 616 "
Hawaiian/Pacific IslanderPct: " 0.2 "
HispanicNo: " 168,888 "
HispanicPct: " 46.7 "
Multi-RacialNo: " 4,333 "
Multi-RacialPct: " 1.2 "
Native American/AlaskanNo: " 1,061 "
Native American/AlaskanPct: " 0.3 "
Network: ""
Not AvailableNo: " 1,253 "
Not AvailablePct: " 0.3 "
School ID: ""
School Name: "District Total"
WhiteNo: " 38,016 "
WhitePct: " 10.5 "
```

Subsequent lines:
* Each line represents one school's demographics for the given year.

Sample:

```
"Total": " 282 "
African AmericanNo: "14"
African AmericanPct: "5.0"
Asian/ Pacific Islander (Retired)No: "0"
Asian/ Pacific Islander (Retired)Pct: "0.0"
AsianNo: "24"
AsianPct: "8.5"
Hawaiian/Pacific IslanderNo: "0"
Hawaiian/Pacific IslanderPct: "0.0"
HispanicNo: "225"
HispanicPct: "79.8"
Multi-RacialNo: "2"
Multi-RacialPct: "0.7"
Native American/AlaskanNo: "3"
Native American/AlaskanPct: "1.1"
Network: "Network 1"
Not AvailableNo: "0"
Not AvailablePct: "0.0"
School ID: "610212"
School Name: "Albany Park Multicultural Academy"
WhiteNo: "14"
WhitePct: "5.0"
```
