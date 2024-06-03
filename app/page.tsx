import Link from "next/link";

const RECENT_SIZE = 100;

type ContestType = "Div. 2" | "Div. 3";

type RawContest = {
  name: string;
  id: number;
  [x: string]: unknown;
};

type Contest = {
  name: ContestType;
  id: number;
};

type Index = "A" | "B" | "B1" | "B2" | "C" | "D" | "E" | "F" | "G";

type RawProblem = {
  contestId: number;
  index: Index;
  name: string;
  rating: number;
  [x: string]: unknown;
};

type Problem = {
  contestId: number;
  index: Index;
  name: string;
  rating: number;
};

type RequiredProblem = Problem & Contest & { url: string };

const isDiv2 = (contest: RawContest) => contest.name.indexOf("Div. 2") >= 0;
const isDiv3 = (contest: RawContest) => contest.name.indexOf("Div. 3") >= 0;

function isRequiredContest(contest: RawContest) {
  return isDiv2(contest) || isDiv3(contest);
}

async function fetchContests() {
  try {
    const response = await fetch("https://codeforces.com/api/contest.list", {
      cache: "no-store",
    });

    const rawContests = (await response.json()).result as RawContest[];
    const contestList = rawContests.filter(
      (contest) => isRequiredContest(contest)
    );
    const reversedContestList = contestList.slice(0, RECENT_SIZE);
    const contests: Contest[] = reversedContestList.map((contest) => {
      return {
        id: contest.id,
        name: isDiv2(contest) ? "Div. 2" : "Div. 3",
      };
    });
    return contests;
  } catch (err) {
    return null;
  }
}

async function fetchProblems() {
  try {
    const response = await fetch(
      "https://codeforces.com/api/problemset.problems",
      {
        cache: "no-store",
      }
    );
    // TODO: Add rating support
    const rawProblems = (await response.json()).result.problems as RawProblem[];
    return rawProblems;
  } catch (err) {
    return null;
  }
}

function getProblemList(
  contests: Contest[],
  problems: Problem[]
): RequiredProblem[] {
  const contestMap = new Map();

  contests.forEach((contest) => {
    contestMap.set(contest.id, contest);
  });

  const requiredProblems = problems.filter((problem) => {
    const contest = contestMap.get(problem.contestId);
    if (!contest) {
      return false;
    }
    let set = new Set();
    switch (true) {
      case isDiv2(contest):
        set = new Set(["B", "B1", "B2"]);
        break;
      case isDiv3(contest):
        set = new Set(["B2", "C", "D"]);
    }
    return (
      contestMap.has(problem.contestId) &&
      set.has(problem.index) &&
      problem.rating >= 1200
    );
  });

  const formattedProblems: RequiredProblem[] = requiredProblems.map(
    (problem) => {
      return {
        ...contestMap.get(problem.contestId),
        ...problem,
        url: `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`,
      };
    }
  );
  return formattedProblems;
}

function Problem(problem: RequiredProblem) {
  return <Link href={problem.url}>
  <div className="border p-2 m-2">
    <div className="flex flex-1">
      <pre>{problem.contestId}.  </pre>
      <p>{problem.name}</p>
      <h1>({problem.index})</h1>
    </div>
  </div>
  </Link>;
}

export default async function Home() {
  const contests = await fetchContests();
  const problems = await fetchProblems();
  let list = [] as RequiredProblem[];

  if (contests && problems) {
    list = getProblemList(contests, problems);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-white text-black">
      <h1>Total: {list.length}</h1>
      {list.reverse().map(item => <Problem  {...item} key={item.id} />)}
    </main>
  );
}
