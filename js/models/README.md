### model.data.highSchools
Population counts for high schools.

Todo: Change from only containing population counts to a general store of data. E.g., from `{2014: {400010: 481}}` to `{2014: {400010: {pop: 481, sat:..., etc:...}}}`.
  
```javascript
model:
{
  data: {
    highSchools: {
      2014: {
        "": 112029,  // Total pop. of all high schools in 2014
        400010: 481, // Total pop. of school 400010 in 2014
        400012: 104,
        400013: 568,
        400015: 166,
        400018: 186,
        ... // All schools this year
      }
      ... // All years
    }
  }
}
```
### model.data.networkProfile
* data.school & data.students: D3-styled arrays for easy plugging into
  .enter() section of D3.
* stats 1 & 2: Useful for sorting network charts by different criteria.
* maxSchools, maxStudents: Useful for providing max values for scaling bars.
```javascript
model:
{
  data: {
    networkProfile: {
      data: {
        school: [ // Schools in networks (D3-styled array of objects)
          {
            network: "AUSL",
            stat: 5,    // # Schools
            year: 2014,
          },
          ... // All networks, 2014-2019
        ],
        student: [ // Students in networks (D3-styled array of objects)
          {
            network: "AUSL", 
            stat: 3286, // # Students
            year: 2014
          },
          ... // All networks, 2014-2019
        ],
        maxSchools: 70, // The max # of schools in any network in any year.
                        // Necessary because it provides the maxiumum width
                        // allowed by any given "bar" in network chart.
        maxStudents: 23375 // The max # of students in any network in any year.
                           // Same use as maxSchools.
        stats1: { // Stats for sort by schools (network chart)
          AUSL: {
            mean: 5,          // Avg. schools per network in any given year
            totalEntries: 6,  // Total years network existed
            totalValue: 30,   // Total schools in network, entire time period
          }
          ... // All networks
        }, 
        stats2: {  // Stats for sort by students (network chart)
          AUSL: {
            mean: 3041.16666,   // Avg. students per network in any given year
            totalEntries: 6,    // Total years network existed
            totalValue: 18247,  // Total students in network, entire time period
          }
          ... // All networks
        }
      }
    }
  }
}
```
### model.data.networkTotals
* Mainly helper data for creating model.data.networkProfile.
* numSchoolsInNetwork: Counts of schools in network in any given year.
* numStudentsInNetwork: Counts of schools in network in any given year.
```javascript
model:
{
  data: {
    networkTotals: {
      numSchoolsInNetwork: {
        2014: {
          AUSL: 5,
          ... // All networks, # schools
        },
        ... // All years, 2014-2019
      },
      numStudentsInNetwork: {
        2014: {
          AUSL: 3286,
          ... // All networks, # students
        },
        ... // All years, 2014-2019
      }
    }
  }
}
```
