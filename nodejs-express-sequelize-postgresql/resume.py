import optuna
from optuna.samplers import TPESampler
# from user_train import objective
import logging
import joblib as joblib
import sys
import scikitplot as skplt
import numpy as np
import matplotlib as matplotlib
from matplotlib import pyplot as plt
from pathlib import Path
# def resume(self, filename):
# self.


name = sys.argv[3]
print(type(name))
user = __import__(name, globals(), locals(), ['objective'],0)
# user = __import__(".user_train", globals(), locals(), ['objective',])
# user = __import__(name, globals(), locals(), ['user_train'])
filename = sys.argv[1]
direct = sys.argv[2]
path = sys.argv[4]
logfilePath = sys.argv[5]
studyfilePath = sys.argv[6]

script_location = Path(__file__).absolute().parent
sfile_location = script_location / studyfilePath

file_location = script_location / logfilePath
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
logger.addHandler(logging.FileHandler(file_location, mode="a"))
print("logging resume")
optuna.logging.enable_propagation()  # Propagate logs to the root logger.
optuna.logging.disable_default_handler()
sampler = TPESampler(seed=10)
# study = joblib.load(sfile_location)
try:
	study = joblib.load(sfile_location)
	print("check")
except EOFError:
	print("nothing to load, file empty!")  # or whatever you want
	study = optuna.create_study(direction=direct)

objective = user.objective
logger.info("Resume optimization.")
study.optimize(lambda trial: objective(trial, path), n_trials=2)
joblib.dump(study, sfile_location)

# with open(file_location) as f:
# 	# assert f.readline().startswith("study reloaded")
# 	assert f.readline() == "Resume optimization.\n"


file_location = script_location / path
file_location = str(file_location)
print(file_location)
optuna.visualization.matplotlib.plot_edf(study)
plt.savefig(file_location + " 1.png", bbox_inches='tight', dpi=600)
optuna.visualization.matplotlib.plot_intermediate_values(study)
plt.savefig(file_location + " 2.png", bbox_inches='tight', dpi=600)
optuna.visualization.matplotlib.plot_optimization_history(study)
plt.savefig(file_location + " 3.png", bbox_inches='tight', dpi=600)
optuna.visualization.matplotlib.plot_parallel_coordinate(study)
plt.savefig(file_location + " 4.png", bbox_inches='tight', dpi=600)
print("##")
print(study.best_trial.number)

sys.exit(0);