import optuna as optuna
import matplotlib as matplotlib
from matplotlib import pyplot as f
import joblib as joblib
import pandas as pd
import sys

print("printing")
filename = sys.argv[1]
print(filename)
study = joblib.load(filename + '.pkl')
print("1")
df = study.trials_dataframe()
print("2")
# assert isinstance(df, pandas.DataFrame)
output = df.to_json()
# sys.stdout.flush()
optuna.visualization.matplotlib.plot_edf(study)
f.savefig(filename + " 1.png", bbox_inches='tight', dpi=600)
optuna.visualization.matplotlib.plot_intermediate_values(study)
f.savefig(filename + " 2.png", bbox_inches='tight', dpi=600)
print("second")
optuna.visualization.matplotlib.plot_optimization_history(study)
f.savefig(filename + " 3.png", bbox_inches='tight', dpi=600)
optuna.visualization.matplotlib.plot_parallel_coordinate(study)
f.savefig(filename + " 4.png", bbox_inches='tight', dpi=600)

sys.exit(0)