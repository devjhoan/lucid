import { Presets, SingleBar } from "cli-progress";

const bar1 = new SingleBar({}, Presets.rect);
bar1.start(100, 0);

let intialValue = 0;
setInterval(() => {
	bar1.update(intialValue++);
	if (intialValue >= 100) {
		bar1.stop();
		process.exit(0);
	}
}, 50);

export default bar1;
