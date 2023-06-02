export type TimingObjectVector =
{
	position: number;
	velocity: number
};

export default interface TimingObject 
{
	new(options: { vector: TimingObjectVector }): TimingObject;

	on(event: "timeupdate", callback: ()=>void): void;
	off(event: "timeupdate", callback: ()=>void): void;

	query(): { position: number };
	update(vector: TimingObjectVector): void;
	
};