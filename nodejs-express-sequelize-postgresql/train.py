import optuna
from optuna.samplers import TPESampler
# from user_train import objective
import logging
import joblib as joblib
import sys


print("start")
name = sys.argv[3]
file = sys.argv[4]
print(type(name))
# user = __import__(name, globals(), locals(), ['objective', 'getPath'])
user = __import__(name, globals(), locals(), ['file'])
filename = sys.argv[1]
direct = sys.argv[2]
path = sys.argv[5]
user.getPath(path)

logger = logging.getLogger()

logger.setLevel(logging.INFO)  # Setup the root logger.
logger.addHandler(logging.FileHandler(filename + "." + "log", mode="w"))
print("logging start.")

optuna.logging.enable_propagation()  # Propagate logs to the root logger.
optuna.logging.disable_default_handler()  # Stop showing logs in sys.stderr.
sampler = TPESampler(seed=10)

study = optuna.create_study(direction=direct)
print("Created study")


objective = user.objective
logger.info("Start optimization.")
study.optimize(objective, n_trials=2)
joblib.dump(study, filename + '.pkl')
with open(filename + "." + "log") as f:
	assert f.readline().startswith("A new study created")
	assert f.readline() == "Start optimization.\n"


sys.exit(0);

#if __name__ == '__main__':
	#train(sys.argv[1])

