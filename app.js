const express = require("express");
const app = express();

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error is ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Home API
app.get("/", (req, res) => {
  res.send("Hi Darling....!");
});

//Convert States DB
const convertStatesDB = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//GET States API 1
app.get("/states/", async (req, res) => {
  const getStatesQuery = `
    SELECT
        *
    FROM
        state;
    `;

  const statesData = await db.all(getStatesQuery);
  res.send(statesData.map((eachState) => convertStatesDB(eachState)));
});

//GET State API 2
app.get("/states/:stateId/", async (req, res) => {
  const { stateId } = req.params;
  const getStateQuery = `
    SELECT
        *
    FROM
        state
    WHERE
        state_id = ${stateId};
    `;

  const stateData = await db.get(getStateQuery);
  res.send(convertStatesDB(stateData));
});

//POST Districts API 3
app.post("/districts/", async (req, res) => {
  const { districtName, stateId, cases, cured, active, deaths } = req.body;
  const postDistrictsQuery = `
    INSERT INTO
        district(
            district_name,
            state_id,
            cases,
            cured,
            active,
            deaths
        )
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );
    `;

  await db.run(postDistrictsQuery);
  res.send("District Successfully Added");
});

//Convert Districts DB
const convertDistrictsDB = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//GET District API 4
app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const getDistrictQuery = `
    SELECT
        *
    FROM
        district
    WHERE
        district_id = ${districtId};
    `;

  const districtData = await db.get(getDistrictQuery);
  res.send(convertDistrictsDB(districtData));
});

//DELETE District API 5
app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const deleteDistrictQuery = `
    DELETE 
    FROM
        district
    WHERE
        district_id = ${districtId};
    `;

  await db.run(deleteDistrictQuery);
  res.send("District Removed");
});

//PUT District API 6
app.put("/districts/:districtId", async (req, res) => {
  const { districtId } = req.params;
  const { districtName, stateId, cases, cured, active, deaths } = req.body;
  const putDistrictQuery = `
    UPDATE
        district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE
        district_id = ${districtId};
    `;

  await db.run(putDistrictQuery);
  res.send("District Details Updated");
});

//GET State Stats API 7
app.get("/states/:stateId/stats", async (req, res) => {
  const { stateId } = req.params;
  const getStateStatsQuery = `
  SELECT
    sum(district.cases) AS totalCases,
    sum(district.cured) AS totalCured,
    sum(district.active) AS totalActive,
    sum(district.deaths) AS totalDeaths
  FROM
    state INNER JOIN district
    ON state.state_id = district.state_id
  WHERE
    state.state_id = ${stateId};
  `;

  const stateStats = await db.get(getStateStatsQuery);
  res.send(stateStats);
});

//GET District Details API 8
app.get("/districts/:districtId/details/", async (req, res) => {
  const { districtId } = req.params;
  const getDistrictDetailsQuery = `
    SELECT
        state.state_name AS stateName
    FROM
        state INNER JOIN district
        ON state.state_id = district.state_id
    WHERE
        district.district_id = ${districtId};
    `;

  const districtDetails = await db.get(getDistrictDetailsQuery);
  res.send(districtDetails);
});

module.exports = app;
