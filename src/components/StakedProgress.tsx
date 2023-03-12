export default function StakedProgress(props: {
  staked: number;
  totalSupply: number;
}) {
  const { staked, totalSupply } = props;
  return (
    <div className="staked-progress">
      <div
        className="progress"
        style={{ width: `calc(${(100 * staked) / totalSupply}%)` }}
      ></div>
      <span className="">{(100 * staked) / totalSupply}% staked</span>
    </div>
  );
}
