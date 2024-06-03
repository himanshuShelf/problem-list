import Image from "next/image";

const RECENT_SIZE = 50;

type ContestType = "Div. 2" | "Div. 3";
type Phase = "BEFORE" | "FINISHED";

type RawContest = {
  name: string;
  phase: Phase;
  id: number;
  [x: string]: unknown;
};

type Contest = {
  name: ContestType;
  id: number;
};

const isDiv2 = (contest: RawContest) =>
  contest.name.indexOf("Div. 2") >= 0;
const isDiv3 = (contest: RawContest) =>
  contest.name.indexOf("Div. 3") >= 0;

function isRequiredContest(contest: RawContest) {
  return isDiv2(contest) || isDiv3(contest);
}

async function fetchContests() {
  try {
    const response = await fetch(
      "https://codeforces.com/api/contest.list",
      {
        cache: "no-store"
      }
    );

    const rawContests = (await response.json()).result as RawContest[];
    const contestList = rawContests.filter(
      (contest) => isRequiredContest(contest) && contest.phase === "FINISHED"
    );
    const reversedContestList = contestList.slice(0, RECENT_SIZE);
    console.log(reversedContestList)
    const contests: Contest[] = reversedContestList.map((contest) => {
      return {
        id: contest.id,
        name: isDiv2(contest) ? "Div. 2" : "Div. 3"
      }
    });
    return contests
  } catch (err) {
    return null;
  }
}

export default async function Home() {
  const contests = await fetchContests();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {JSON.stringify(contests)}
    </main>
  );
}
