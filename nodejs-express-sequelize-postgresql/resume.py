import optuna
from optuna.samplers import TPESampler
from user_train import objective
import sys
import logging
import joblib as joblib
# def resume(self, filename):
# self.
filename = sys.argv[1]

# print('Best trial until now:')
# sys.stdout.flush()
# print(' Value: ', study.best_trial.value)
# sys.stdout.flush()
# print(' Params: ')
# sys.stdout.flush()
# for key,value in study.best_trial.params.items():
# 	printf ('{key}: {value}')
# 	# sys.stdout.flush()

logger = logging.getLogger()

logger.setLevel(logging.INFO)  # Setup the root logger.
logger.addHandler(logging.FileHandler(filename + "." + "log", mode="a"))
print("logging resume")
optuna.logging.enable_propagation()  # Propagate logs to the root logger.
optuna.logging.disable_default_handler()
sampler = TPESampler(seed=10)
study = joblib.load(filename + '.pkl')
logger.info("Resume optimization.")

study.optimize(objective, n_trials=2)
joblib.dump(study, filename + '.pkl')
# with open(filename + "." + "log") as f:
# 	# assert f.readline().startswith("study reloaded")
# 	assert f.readline() == "Resume optimization.\n"

sys.exit(0);